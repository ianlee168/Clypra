use tauri::Manager;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

pub mod thumbnail_engine;
use thumbnail_engine::{DensityLevel, ThumbnailTile, init_thumbnail_engine, get_cache_stats, clear_video_thumbnail_cache};
use thumbnail_engine::decoder::{get_decoder, release_decoder};

#[cfg(test)]
mod thumbnail_engine_tests;

#[cfg(test)]
mod thumbnail_engine_proptest;

pub mod models;
pub mod commands;

/// Initialize the thumbnail engine with app cache directory
#[tauri::command]
async fn init_thumbnail_cache(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Initialize cache directory
    let cache_dir = app_handle
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;
    init_thumbnail_engine(cache_dir).await
}

/// Get thumbnail cache statistics
#[tauri::command]
fn get_thumbnail_cache_stats() -> serde_json::Value {
    get_cache_stats()
}

/// Clear thumbnail cache for a specific video
#[tauri::command]
async fn clear_thumbnail_cache(video_path: String) {
    clear_video_thumbnail_cache(&video_path).await;
}

/// Extract poster frame at 10% mark of clip duration
/// 
/// Extract poster frame using native decoder directly (bypasses queue system)
/// Returns base64-encoded WebP data URL for immediate display
#[tauri::command]
async fn extract_poster_frame_command(
    video_path: String,
    duration: f64,
    dpr: f64,
) -> Result<String, String> {
    use thumbnail_engine::decoder::get_decoder;
    use image::codecs::webp::WebPEncoder;
    
    // Calculate poster frame time (10% of duration, or 0.5s for short clips)
    let poster_time = if duration < 1.0 {
        0.5
    } else {
        duration * 0.1
    };
    
    // Base thumbnail long/short edge
    let long_edge: u32 = if dpr >= 1.5 { 320 } else { 160 };
    let short_edge: u32 = if dpr >= 1.5 { 180 } else { 90 };
    
    let decoder_arc = get_decoder(&video_path).await?;
    let (rgba_bytes, out_w, out_h) = {
        let mut decoder = decoder_arc.lock().await;
        let rotation = decoder.rotation();
        
        // For portrait videos (90°/270°), request portrait dimensions.
        // decode_frame handles the rotation internally — caller just
        // specifies the desired output size in display orientation.
        let (req_w, req_h) = if rotation == 90 || rotation == 270 {
            (short_edge, long_edge) // portrait: 90×160
        } else {
            (long_edge, short_edge) // landscape: 160×90
        };
        
        let bytes = decoder.decode_frame(poster_time, req_w, req_h)?;
        (bytes, req_w, req_h)
    };
    
    // Encode RGBA to WebP
    let mut webp_data = Vec::new();
    let encoder = WebPEncoder::new_lossless(&mut webp_data);
    encoder.encode(&rgba_bytes, out_w, out_h, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("WebP encode failed: {}", e))?;
    
    // Convert to base64 data URL
    let base64_data = BASE64.encode(&webp_data);
    Ok(format!("data:image/webp;base64,{}", base64_data))
}



// ─── Native FFmpeg Decoder Commands ─────────────────────────────────────────
// Fast path for thumbnail extraction using ffmpeg-next (no sidecar overhead)

use thumbnail_engine::{ResolutionTier, GLOBAL_CACHE};

/// Encode RGBA bytes to WebP and save to cache
async fn save_rgba_as_webp(
    rgba_bytes: &[u8],
    width: u32,
    height: u32,
    cache_path: &std::path::Path,
) -> Result<(), String> {
    use image::codecs::webp::WebPEncoder;
    let start = std::time::Instant::now();
    
    // Encode RGBA to WebP
    let mut webp_data = Vec::new();
    let encoder = WebPEncoder::new_lossless(&mut webp_data);
    encoder.encode(rgba_bytes, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("WebP encoding failed: {}", e))?;
    let encode_time = start.elapsed();
    
    // Ensure parent directory exists
    if let Some(parent) = cache_path.parent() {
        tokio::fs::create_dir_all(parent).await
            .map_err(|e| format!("Failed to create cache directory: {}", e))?;
    }
    
    // Write to file
    tokio::fs::write(cache_path, &webp_data).await
        .map_err(|e| format!("Failed to write WebP file: {}", e))?;
    
    eprintln!("[save_rgba_as_webp] Encoded {}x{} → {} bytes in {:?} (file: {:?})",
              width, height, webp_data.len(), encode_time, cache_path.file_name().unwrap_or_default());
    
    Ok(())
}

/// Extract a single frame using the native decoder (fast path)
/// Returns base64-encoded WebP data URL
#[tauri::command]
async fn decode_frame(
    video_path: String,
    time_secs: f64,
    width: u32,
    height: u32,
) -> Result<String, String> {
    use image::codecs::webp::WebPEncoder;
    
    // Get or create decoder (reused across calls)
    let decoder = get_decoder(&video_path).await?;
    
    // Decode frame (3-15ms for subsequent frames)
    let rgba_bytes = {
        let mut decoder_guard = decoder.lock().await;
        decoder_guard.decode_frame(time_secs, width, height)?
    };
    
    // Encode to WebP
    let mut webp_data = Vec::new();
    let encoder = WebPEncoder::new_lossless(&mut webp_data);
    encoder.encode(&rgba_bytes, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("WebP encoding failed: {}", e))?;
    
    // Return as base64 data URL
    let base64_data = BASE64.encode(&webp_data);
    Ok(format!("data:image/webp;base64,{}", base64_data))
}

/// Extract multiple frames using the native decoder with streaming
/// Same architecture as get_thumbnails_for_timestamps but uses native decoder
#[tauri::command]
async fn decode_frames_streaming(
    video_path: String,
    timestamps: Vec<f64>,
    density: DensityLevel,
    width: u32,
    height: u32,
    duration: f64,
    on_tile: tauri::ipc::Channel<ThumbnailTile>,
) -> Result<(), String> {
    let start = std::time::Instant::now();
    let video_id = format!("{:x}", md5::compute(&video_path));
    let resolution_tier = if width >= 160 { ResolutionTier::Tier2x } else { ResolutionTier::Tier1x };
    
    eprintln!("[decode_frames_streaming] START video_id={} timestamps={} density={:?} size={}x{}", 
              video_id, timestamps.len(), density, width, height);
    
    // Get or create video cache entry for cache checks
    let video_cache = thumbnail_engine::get_video_cache(&video_path, duration).await;
    
    // Check cache for existing frames
    let mut missing_times = Vec::new();
    let mut cache_hits = 0u32;
    let mut sent_count = 0u32;
    
    for &time in &timestamps {
        if let Some((path, found_density)) = video_cache.get_frame_path(time, density) {
            cache_hits += 1;
            let path_str = path.to_string_lossy().to_string();
            if cache_hits <= 3 {
                eprintln!("[decode_frames_streaming] Initial cache hit #{}: time={:.2}s, path={}", 
                          cache_hits, time, &path_str[..80.min(path_str.len())]);
            }
            // Send cached tile immediately
            match on_tile.send(ThumbnailTile {
                time,
                path: path_str.clone(),
                density: found_density,
            }) {
                Ok(_) => {
                    sent_count += 1;
                    eprintln!("[STREAM] Sent cached frame #{}/{}: time={:.2}s", sent_count, timestamps.len(), time);
                }
                Err(e) => {
                    eprintln!("[STREAM] ✗ Failed to send cached tile: {:?}", e);
                }
            }
        } else {
            missing_times.push(time);
        }
    }
    
    eprintln!("[decode_frames_streaming] Cache check: hits={} missing={} sent={}", cache_hits, missing_times.len(), sent_count);
    
    // If all cached, return early
    if missing_times.is_empty() {
        eprintln!("[decode_frames_streaming] All cached, returning early ({:?})", start.elapsed());
        return Ok(());
    }
    
    // Spawn extraction task and AWAIT it — invoke won't resolve until all frames are streamed.
    // This ensures the frontend's .then() fires after all frames have arrived via the channel.
    let total_frames = timestamps.len();
    let handle = tokio::spawn(async move {
        let bg_start = std::time::Instant::now();
        eprintln!("[decode_frames_streaming] BG task starting, missing={}", missing_times.len());
        
        // Get or create decoder for this video
        let decoder = match get_decoder(&video_path).await {
            Ok(d) => {
                eprintln!("[decode_frames_streaming] Decoder acquired ({:?})", bg_start.elapsed());
                d
            }
            Err(e) => {
                eprintln!("[decode_frames_streaming] Failed to get decoder: {}", e);
                return;
            }
        };
        
        // Extract missing frames
        let mut frames_decoded = 0u32;
        let mut frames_failed = 0u32;
        let mut frames_sent = sent_count;
        const BATCH_SIZE: usize = 10;
        
        for (batch_idx, time) in missing_times.iter().enumerate() {
            let frame_start = std::time::Instant::now();
            
            // Get cache path
            let cache_path = match GLOBAL_CACHE.frame_path(&video_id, density, *time, resolution_tier).await {
                Some(p) => p,
                None => {
                    eprintln!("[decode_frames_streaming] Cache not initialized");
                    continue;
                }
            };
            
            // Skip if already cached on disk (race with preload)
            if cache_path.exists() {
                let path_str = cache_path.to_string_lossy().to_string();
                let _ = on_tile.send(ThumbnailTile {
                    time: *time,
                    path: path_str,
                    density,
                });
                frames_decoded += 1;
                continue;
            }
            
            // Decode frame using native decoder
            let rgba_bytes = match decoder.lock().await.decode_frame(*time, width, height) {
                Ok(bytes) => bytes,
                Err(e) => {
                    frames_failed += 1;
                    if frames_failed <= 5 {
                        eprintln!("[decode_frames_streaming] Decode failed at {}s: {}", *time, e);
                    }
                    continue;
                }
            };
            
            // Save to cache as WebP
            if let Err(e) = save_rgba_as_webp(&rgba_bytes, width, height, &cache_path).await {
                frames_failed += 1;
                eprintln!("[decode_frames_streaming] Failed to save frame: {}", e);
                continue;
            }
            
            frames_decoded += 1;
            
            // Yield every BATCH_SIZE frames to keep runtime fair
            if batch_idx % BATCH_SIZE == 0 && batch_idx > 0 {
                tokio::task::yield_now().await;
            }
            
            // Update in-memory cache
            if let Some(vc) = GLOBAL_CACHE.get_video(&video_path) {
                if let Some(level_cache) = vc.levels.get(&density) {
                    let cached_frame = thumbnail_engine::CachedFrame::new(*time, cache_path.clone());
                    level_cache.insert(*time, cached_frame);
                    if let Ok(metadata) = std::fs::metadata(&cache_path) {
                        GLOBAL_CACHE.total_size.fetch_add(metadata.len(), std::sync::atomic::Ordering::Relaxed);
                    }
                }
            }
            
            // Evict if needed
            GLOBAL_CACHE.evict_if_needed().await;
            
            // Stream result to frontend
            let path_str = cache_path.to_string_lossy().to_string();
            match on_tile.send(ThumbnailTile {
                time: *time,
                path: path_str.clone(),
                density,
            }) {
                Ok(_) => {
                    frames_sent += 1;
                    eprintln!("[STREAM] Sent decoded frame #{}/{}: time={:.2}s path={}", 
                              frames_sent, total_frames, *time, 
                              &path_str[path_str.len().saturating_sub(60)..]);
                }
                Err(e) => {
                    eprintln!("[STREAM] ✗ Failed to send frame #{}: {:?}", frames_sent + 1, e);
                }
            }
            
            // Log first few frames and then every 20th
            if frames_decoded <= 3 || frames_decoded % 20 == 0 {
                eprintln!("[decode_frames_streaming] Frame {} at {:.2}s decoded+saved in {:?}", 
                          frames_decoded, *time, frame_start.elapsed());
            }
        }
        
        eprintln!("[decode_frames_streaming] BG task complete: decoded={} failed={} sent={}/{} total_time={:?}",
                  frames_decoded, frames_failed, frames_sent, total_frames, bg_start.elapsed());
    });
    
    // Await the task — invoke resolves only after all frames are streamed
    handle.await.map_err(|e| format!("Extraction task failed: {}", e))?;
    
    Ok(())
}

/// Release the native decoder for a video to free memory
/// Call this when a clip is removed from the project
#[tauri::command]
fn release_video_decoder(video_path: String) {
    release_decoder(&video_path);
}

/// Get video metadata using the native decoder (fast, no sidecar)
#[tauri::command]
async fn get_video_metadata_fast(video_path: String) -> Result<serde_json::Value, String> {
    let decoder = get_decoder(&video_path).await?;
    let guard = decoder.lock().await;
    
    Ok(serde_json::json!({
        "duration": guard.duration,
        "width": guard.width,
        "height": guard.height,
        "path": video_path,
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(dir) = handle.path().app_cache_dir() {
                    let _ = init_thumbnail_engine(dir).await;
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            init_thumbnail_cache,
            get_thumbnail_cache_stats,
            clear_thumbnail_cache,
            extract_poster_frame_command,
            commands::media::get_video_metadata,
            commands::media::extract_poster_frame,
            commands::project::save_project,
            commands::project::load_project,
            commands::project::get_recent_projects,
            commands::project::delete_project,
            // Native FFmpeg decoder commands (fast path for thumbnails)
            decode_frame,
            decode_frames_streaming,
            release_video_decoder,
            get_video_metadata_fast,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
