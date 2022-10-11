#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use window_vibrancy::{apply_blur, apply_vibrancy, NSVisualEffectMaterial};

use std::time::{SystemTime, UNIX_EPOCH};
use std::env;
use std::process;

use tauri::*;
use tauri::Manager;

#[tauri::command]
fn set_always_on_top(app_handle: tauri::AppHandle, is_always_on_top: bool) {
  let window = app_handle.get_window("main").unwrap();
  window.set_always_on_top(is_always_on_top);
}

#[tauri::command]
fn hide_window(app_handle: tauri::AppHandle, is_pinned: bool) {
  if !is_pinned{
    let window = app_handle.get_window("main").unwrap();
    let tray_handle = app_handle.tray_handle();
    let menu_item = tray_handle.get_item("toggle");
    window.hide();
    menu_item.set_title("Show Easel");
  }
}

fn make_tray() -> SystemTray {
  let menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("toggle".to_string(), "Show Easel"))
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));
  return SystemTray::new().with_menu(menu);
}

fn handle_tray_event(app_handle: &AppHandle, event: SystemTrayEvent) {
  if let SystemTrayEvent::MenuItemClick { id, .. } = event {
    if id.as_str() == "quit" {
      process::exit(0);
    }
    if id.as_str() == "toggle" {
      let window = app_handle.get_window("main").unwrap();
      let tray_handle = app_handle.tray_handle();
      let menu_item = tray_handle.get_item("toggle");
      if window.is_visible().unwrap() {        
        window.hide();
        menu_item.set_title("Show Easel");
      } else {
        window.show();
        window.center();
        window.set_skip_taskbar(true);
        window.set_focus();
        // window.set_always_on_top(true);
        // window.set_cursor_grab(true);
        menu_item.set_title("Hide Easel");
      }
    }
  }
}

#[tauri::command]
fn on_button_clicked() -> String {
    let start = SystemTime::now();
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis();
    format!(
        "on_button_clicked called from Rust! (timestamp: {}ms)",
        since_the_epoch
    )
}

fn main() {


    let mut app = tauri::Builder::default()
        .system_tray(make_tray())
        .on_system_tray_event(handle_tray_event)
        .invoke_handler(tauri::generate_handler![
          on_button_clicked, 
          hide_window, 
          set_always_on_top
        ])
        .setup(|app| {
          
          // WindowBuilder::decorations(false);

          let window = app.get_window("main").unwrap();
          #[cfg(debug_assertions)] // only include this code on debug builds
          {
            window.open_devtools();
            window.close_devtools();
            // window.round_corners(10.0, 10.0);
          }


        //   #[cfg(target_os = "windows")]
        // {
          let _ = window_shadows::set_shadow(&window, true);
          // let _ = window_vibrancy::apply_blur(&window, Some((0, 0, 0, 0)));
          // #[cfg(target_os = "macos")]
// apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
// .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

#[cfg(target_os = "windows")]
apply_blur(&window, Some((18, 18, 18, 125))).expect("Unsupported platform! 'apply_blur' is only supported on Windows");
        // }

          Ok(())
        })
        .on_page_load(|window, _| {
          println!("Page loaded");
          window.listen("tauri://blur", |event| {
              println!("blurring");
          });
      })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);


    app.run(|app_handle, event| {
        
    });
}
