use crate::thumbnail_engine::decoder::get_decoder;
use crate::models::VideoMetadata;
use base64::Engine;
use image::ImageEncoder;
use std::fs;

/// Get video metadata using native FFmpeg decoder (fast, no CLI overhead)
#[tauri::command]
pub async fn get_video_metadata(path: String) -> Result<VideoMetadata, String> {
    eprintln!("[get_video_metadata] Starting for: {}", path);
    
    // Use native decoder to get metadata
    let decoder = get_decoder(&path).await?;
    let guard = decoder.lock().await;
    
    let width = guard.width;
    let height = guard.height;
    let duration = guard.duration;
    let fps = guard.fps();
    
    drop(guard); // Release lock
    
    let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);

    eprintln!("[get_video_metadata] Extracted: duration={}s, {}x{}, fps={}", 
              duration, width, height, fps);

    Ok(VideoMetadata {
        duration,
        width,
        height,
        fps,
        size,
    })
}

/// Extract poster frame using native decoder (fast, no CLI overhead)
#[tauri::command]
pub async fn extract_poster_frame(path: String, time: f64) -> Result<String, String> {
    use image::codecs::png::PngEncoder;
    
    eprintln!("[extract_poster_frame] Extracting frame at {}s from {}", time, path);
    
    // Use native decoder
    let decoder = get_decoder(&path).await?;
    
    // Decode frame at specified time (90px height for poster)
    let rgba_bytes = {
        let mut guard = decoder.lock().await;
        guard.decode_frame(time, 160, 90)?
    };
    
    // Encode to PNG
    let mut png_data = Vec::new();
    let encoder = PngEncoder::new(&mut png_data);
    encoder.write_image(&rgba_bytes, 160, 90, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("PNG encoding failed: {}", e))?;
    
    let encoded = base64::engine::general_purpose::STANDARD.encode(&png_data);
    Ok(format!("data:image/png;base64,{}", encoded))
}
