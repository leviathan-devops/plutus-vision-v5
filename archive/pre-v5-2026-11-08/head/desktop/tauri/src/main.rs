// Plutus Vision — native desktop shell.
//
// A thin Tauri v2 host that opens the pine-ide renderer (served locally by
// scripts/pv-server.py on :9851) in a REAL desktop window on the operator's
// session. On Linux Tauri uses the system libwebkit2gtk-4.1 engine, so this is
// a single native process + webkit's web/network helpers — no bundled browser,
// no multi-process Chromium.
//
// The URL is read from PV_URL (default http://127.0.0.1:9851/pine.html); the
// launcher scripts/pv-ide.sh counterpart in desktop/pine-ide sets it.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Url, WebviewUrl, WebviewWindowBuilder};

fn main() {
    let url = std::env::var("PV_URL")
        .unwrap_or_else(|_| "http://127.0.0.1:9851/pine.html".to_string());
    let title =
        std::env::var("PV_TITLE").unwrap_or_else(|_| "Plutus Vision".to_string());
    let parsed = Url::parse(&url).expect("PV_URL is not a valid URL");

    tauri::Builder::default()
        .setup(move |app| {
            let win = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(parsed.clone()),
            )
            .title(title.clone())
            .inner_size(1626.0, 931.0)
            .resizable(true)
            .build()?;
            let _ = win.maximize();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running plutus-vision");
}
