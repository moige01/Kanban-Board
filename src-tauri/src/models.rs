use serde::{Deserialize, Serialize};

// TODO: timestamps are stored and returned as raw RFC3339 strings. Consider a
// newtype wrapper or a custom sqlx type that validates the format on decode.

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    // TODO: deleted_at is a soft-delete sentinel that the frontend never needs.
    // Strip it from the serialized response with #[serde(skip_serializing)].
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Board {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub created_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub id: String,
    pub board_id: String,
    pub name: String,
    pub position: f64,
    pub created_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    pub id: String,
    pub column_id: String,
    pub title: String,
    pub description: String,
    pub due_date: Option<String>,
    // TODO: f64 positions degrade with many midpoint insertions (positions
    // converge toward zero). Add a reorder_positions command that renormalizes
    // all positions to integer steps when the gap drops below a threshold.
    pub position: f64,
    pub created_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Label {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CardWithLabels {
    #[serde(flatten)]
    pub card: Card,
    pub labels: Vec<Label>,
}
