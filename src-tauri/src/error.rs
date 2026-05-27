use serde::Serialize;

// TODO: add more variants as the app grows, e.g.:
//   Validation(String)  — bad user input (return 422-equivalent)
//   Conflict(String)    — duplicate name, etc.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Db(#[from] sqlx::Error),
    #[error("Not found")]
    NotFound,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        // TODO: serialize as a structured object { "code": "...", "message": "..." }
        // so the frontend can match on error type instead of parsing strings.
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
