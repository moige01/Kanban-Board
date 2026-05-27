mod commands;
mod db;
mod error;
mod models;

use tauri::Manager;

use commands::{
    boards::{create_board, delete_board, list_boards, update_board},
    cards::{create_card, delete_card, list_cards, move_card, set_card_labels, update_card},
    columns::{create_column, delete_column, list_columns, move_column, update_column},
    labels::{create_label, delete_label, list_labels, update_label},
    projects::{create_project, delete_project, list_projects, update_project},
    settings::{get_setting, set_setting},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            // TODO: block_on in the setup hook blocks Tauri's main thread while
            // the DB initializes. Consider spawning the task and surfacing an
            // error window on failure instead of panicking.
            tauri::async_runtime::block_on(async move {
                let db = db::init(&handle).await.expect("failed to initialize database");
                handle.manage(db);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_projects,
            create_project,
            update_project,
            delete_project,
            list_boards,
            create_board,
            update_board,
            delete_board,
            list_columns,
            create_column,
            update_column,
            move_column,
            delete_column,
            list_cards,
            create_card,
            update_card,
            move_card,
            delete_card,
            set_card_labels,
            list_labels,
            create_label,
            update_label,
            delete_label,
            get_setting,
            set_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
