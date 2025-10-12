library(shiny)
library(readr)
library(dplyr)
library(ggplot2)

# Paths relative to this app.R location
MODEL_PATH <- "../../Milestone_3/Task_03/outputs/final_random_forest_model.rds"
TRAIN_PATH <- "../../Data/04_Split/train_data.csv"
TEST_PATH  <- "../../Data/04_Split/test_data.csv"
META_PATH  <- "../../Data/03_Scaled/feature_metadata.csv"

# Load resources with basic validation
model <- NULL
train <- NULL
meta  <- NULL

if (file.exists(MODEL_PATH)) {
  # randomForest package may be required for predict method dispatch
  suppressMessages({
    tryCatch({
      library(randomForest)
    }, error = function(e) {})
  })
  model <- tryCatch(readRDS(MODEL_PATH), error = function(e) NULL)
}

if (file.exists(TRAIN_PATH)) {
  train <- tryCatch(readr::read_csv(TRAIN_PATH, show_col_types = FALSE), error = function(e) NULL)
}

if (file.exists(META_PATH)) {
  meta <- tryCatch(readr::read_csv(META_PATH, show_col_types = FALSE), error = function(e) NULL)
}

test <- NULL
if (file.exists(TEST_PATH)) {
  test <- tryCatch(readr::read_csv(TEST_PATH, show_col_types = FALSE), error = function(e) NULL)
}

# Helper: compute mode for vectors
mode_val <- function(x) {
  x <- x[!is.na(x)]
  if (length(x) == 0) return(NA)
  ux <- unique(x)
  ux[which.max(tabulate(match(x, ux)))]
}

# Determine feature columns aligned to training schema
feature_cols <- character(0)

# Build feature columns directly from training schema to match model terms
if (!is.null(train)) {
  # Exclude only the response used in training; keep all other engineered predictors
  feature_cols <- setdiff(names(train), c("value_log_scaled"))
}

# Known target/label columns that may indicate leakage
leak_targets <- c("value", "value_log", "value_category")
leaky_cols <- intersect(feature_cols, leak_targets)

# UI ranges and choices from training data (robust bounds)
prec_min <- -2; prec_max <- 2; prec_default <- 0
if (!is.null(train) && "precision_scaled" %in% names(train)) {
  qs <- tryCatch(stats::quantile(train$precision_scaled, probs = c(0.01, 0.99), na.rm = TRUE), error = function(e) NULL)
  if (!is.null(qs)) {
    prec_min <- suppressWarnings(as.numeric(qs[[1]]))
    prec_max <- suppressWarnings(as.numeric(qs[[2]]))
  }
  prec_default <- suppressWarnings(as.numeric(mean(train$precision_scaled, na.rm = TRUE)))
  if (!is.finite(prec_default)) prec_default <- 0
}

sample_size_choices <- c("Small", "Medium", "Large")
if (!is.null(train) && "sample_size_tier" %in% names(train)) {
  vals <- unique(train$sample_size_tier)
  if (is.factor(vals)) sample_size_choices <- levels(vals) else sample_size_choices <- sort(unique(as.character(vals)))
}

schema_ok <- !is.null(train) && length(feature_cols) > 0 && !is.null(model)

ui <- navbarPage(
  title = "Health Outcome Prediction Demo",
  tabPanel(
    "Predict",
    fluidPage(
      fluidRow(
        column(4,
          if (schema_ok) {
            tagList(
              sliderInput("precision_scaled", "Precision (scaled)", min = prec_min, max = prec_max, value = prec_default, step = 0.01),
              uiOutput("precision_hint"),
              checkboxInput("is_preferred", "Preferred Estimate", value = TRUE),
              checkboxInput("high_precision", "High Precision (<= 1 decimal)", value = TRUE),
              selectInput("sample_size_tier", "Sample Size Tier", choices = sample_size_choices, selected = sample_size_choices[[min(2, length(sample_size_choices))]]),
              actionButton("predict", "Predict", class = "btn-primary"),
              br(),
              actionButton("save_scenario", "Save Scenario"),
              downloadButton("download_scenario", "Download Prediction")
            )
          } else {
            helpText("Resources missing. Ensure model, training schema, and metadata files exist.")
          }
        ),
        column(8,
          wellPanel(
            h4("Predicted Log-Scaled Health Index"),
            verbatimTextOutput("pred"),
            hr(),
            plotOutput("train_hist", height = "200px")
          ),
          wellPanel(
            h4("Variable Importance (Top 10)"),
            plotOutput("varimp_plot", height = "240px"),
            tableOutput("varimp_table")
          ),
          conditionalPanel(
            condition = "true",
            if (length(leaky_cols) > 0) div(style = "background-color:#fff3cd;padding:8px;border:1px solid #ffeeba;",
              strong("Warning:"), " Potential target/label columns used as predictors:", paste(leaky_cols, collapse=", "), 
              " — see Milestone 4 notes on leakage.")
          )
        )
      )
    )
  ),
  tabPanel(
    "Diagnostics",
    fluidPage(
      h4("Status"),
      verbatimTextOutput("status"),
      h5("Counts"),
      tableOutput("counts_table")
    )
  ),
  tabPanel(
    "Metrics & Drift",
    fluidPage(
      actionButton("compute_baseline", "Compute Baseline Metrics"),
      tableOutput("baseline_table"),
      plotOutput("baseline_scatter", height = "250px"),
      hr(),
      h5("Drift Snapshot (PSI)"),
      tableOutput("psi_table")
    )
  )
)

server <- function(input, output, session) {
  # Status & counts
  last_latency <- reactiveVal(NA_real_)
  output$status <- renderPrint({
    list(
      model_loaded = !is.null(model),
      train_loaded = !is.null(train),
      meta_loaded  = !is.null(meta),
      test_loaded  = !is.null(test),
      feature_cols = length(feature_cols),
      leaky_predictors = if (length(leaky_cols) > 0) paste(leaky_cols, collapse = ", ") else "none",
      last_latency_ms = round(last_latency() * 1000, 1)
    )
  })
  output$counts_table <- renderTable({
    data.frame(
      Dataset = c("Train", "Test"),
      Rows = c(if (!is.null(train)) nrow(train) else NA, if (!is.null(test)) nrow(test) else NA),
      Cols = c(if (!is.null(train)) ncol(train) else NA, if (!is.null(test)) ncol(test) else NA)
    )
  }, rownames = FALSE)

  # Input sanity hint for precision
  output$precision_hint <- renderUI({
    if (is.null(train) || !"precision_scaled" %in% names(train)) return(NULL)
    qs <- stats::quantile(train$precision_scaled, probs = c(0.01, 0.99), na.rm = TRUE)
    val <- input$precision_scaled
    within <- !is.null(val) && is.finite(val) && val >= qs[[1]] && val <= qs[[2]]
    hint <- if (within) "Within typical training range" else "Outside typical training range"
    span(style = if (within) "color:#155724" else "color:#856404", hint)
  })

  # Variable importance (Top 10)
  varimp_df <- reactive({
    if (is.null(model)) return(NULL)
    imp <- tryCatch(randomForest::importance(model), error = function(e) NULL)
    if (is.null(imp)) return(NULL)
    df <- as.data.frame(imp)
    df$Feature <- rownames(df)
    # For regression RF, IncNodePurity is typical; if %IncMSE exists, prefer it
    score_col <- if ("%IncMSE" %in% names(df)) "%IncMSE" else if ("IncNodePurity" %in% names(df)) "IncNodePurity" else names(df)[1]
    df <- df %>% select(Feature, Score = all_of(score_col)) %>% arrange(desc(Score)) %>% head(10)
    df
  })
  output$varimp_table <- renderTable({ varimp_df() }, rownames = FALSE)
  output$varimp_plot <- renderPlot({
    df <- varimp_df(); if (is.null(df)) return()
    ggplot(df, aes(x = reorder(Feature, Score), y = Score)) +
      geom_col(fill = "#2c7fb8") +
      coord_flip() +
      labs(x = NULL, y = "Importance") +
      theme_minimal(base_size = 11)
  })

  # Training histogram with current value marker
  output$train_hist <- renderPlot({
    if (is.null(train) || !"precision_scaled" %in% names(train)) return()
    ggplot(train, aes(x = precision_scaled)) +
      geom_histogram(bins = 30, fill = "#9ecae1", color = "#ffffff") +
      geom_vline(xintercept = input$precision_scaled, color = "#de2d26", size = 1) +
      labs(title = "Training distribution: precision_scaled", x = NULL, y = NULL) +
      theme_minimal(base_size = 11)
  })

  # Prediction logic
  last_df <- reactiveVal(NULL)
  last_pred <- reactiveVal(NA_real_)

  predict_val <- eventReactive(input$predict, {
    validate(need(schema_ok, "Resources not ready: check model/schema/metadata."))
    t0 <- Sys.time()

    # Start from training schema to preserve classes/levels
    df <- train[1, feature_cols, drop = FALSE]

    # Fill defaults
    for (nm in feature_cols) {
      col <- train[[nm]]
      if (is.numeric(col)) {
        df[[nm]] <- suppressWarnings(as.numeric(mean(col, na.rm = TRUE)))
      } else if (is.factor(col)) {
        mv <- mode_val(col)
        df[[nm]] <- factor(as.character(mv), levels = levels(col))
      } else {
        df[[nm]] <- as.character(mode_val(col))
      }
    }

    # Apply UI overrides if those columns exist in schema
    if ("precision_scaled" %in% names(df) && !is.null(input$precision_scaled)) {
      df$precision_scaled <- as.numeric(input$precision_scaled)
    }
    if ("is_preferred" %in% names(df)) {
      col <- train[["is_preferred"]]
      val <- as.numeric(if (isTRUE(input$is_preferred)) 1 else 0)
      if (is.factor(col)) df$is_preferred <- factor(as.character(val), levels = levels(col)) else df$is_preferred <- val
    }
    if ("high_precision" %in% names(df)) {
      col <- train[["high_precision"]]
      val <- as.numeric(if (isTRUE(input$high_precision)) 1 else 0)
      if (is.factor(col)) df$high_precision <- factor(as.character(val), levels = levels(col)) else df$high_precision <- val
    }
    if ("sample_size_tier" %in% names(df) && !is.null(input$sample_size_tier)) {
      col <- train[["sample_size_tier"]]
      if (is.factor(col)) df$sample_size_tier <- factor(input$sample_size_tier, levels = levels(col)) else df$sample_size_tier <- input$sample_size_tier
    }

    # Predict with loaded model
    val <- tryCatch({
      p <- predict(model, newdata = df)
      as.numeric(p)
    }, error = function(e) {
      showNotification(paste("Prediction failed:", e$message), type = "error", duration = 5)
      NA_real_
    })

    last_df(df)
    last_pred(val)
    last_latency(as.numeric(difftime(Sys.time(), t0, units = "secs")))
    val
  })

  output$pred <- renderPrint({
    req(input$predict)
    val <- predict_val()
    if (!is.na(val)) round(val, 4) else "N/A"
  })

  # Save scenario to file
  observeEvent(input$save_scenario, {
    df <- last_df(); val <- last_pred()
    if (is.null(df) || is.na(val)) { showNotification("No prediction to save yet.", type = "warning"); return() }
    out <- cbind(df, .pred_value_log_scaled = val)
    fn <- paste0("scenario_", format(Sys.time(), "%Y%m%d_%H%M%S"), ".csv")
    tryCatch({
      readr::write_csv(out, fn)
      showNotification(paste("Saved", fn), type = "message")
    }, error = function(e) {
      showNotification(paste("Save failed:", e$message), type = "error")
    })
  })

  # Download scenario
  output$download_scenario <- downloadHandler(
    filename = function() paste0("prediction_", format(Sys.time(), "%Y%m%d_%H%M%S"), ".csv"),
    content = function(file) {
      df <- last_df(); val <- last_pred()
      if (is.null(df) || is.na(val)) stop("No prediction to download")
      out <- cbind(df, .pred_value_log_scaled = val)
      readr::write_csv(out, file)
    }
  )

  # Baseline metrics on test set
  baseline <- eventReactive(input$compute_baseline, {
    if (is.null(test) || is.null(model) || length(feature_cols) == 0) return(NULL)
    tryCatch({
      preds <- predict(model, newdata = test[, feature_cols, drop = FALSE])
      actual <- test$value_log_scaled
      rmse <- sqrt(mean((actual - preds)^2, na.rm = TRUE))
      mae  <- mean(abs(actual - preds), na.rm = TRUE)
      r2   <- suppressWarnings(cor(actual, preds, use = "complete.obs")^2)
      list(rmse = rmse, mae = mae, r2 = r2, df = data.frame(actual = actual, pred = as.numeric(preds)))
    }, error = function(e) NULL)
  })
  output$baseline_table <- renderTable({
    b <- baseline(); if (is.null(b)) return(NULL)
    data.frame(Metric = c("RMSE", "MAE", "R^2"), Value = round(c(b$rmse, b$mae, b$r2), 4))
  }, rownames = FALSE)
  output$baseline_scatter <- renderPlot({
    b <- baseline(); if (is.null(b)) return()
    ggplot(b$df, aes(x = actual, y = pred)) +
      geom_point(alpha = 0.5, color = "#2c7fb8") +
      geom_abline(slope = 1, intercept = 0, linetype = "dashed", color = "#666666") +
      labs(x = "Actual", y = "Predicted", title = "Actual vs Predicted (Test)") +
      theme_minimal(base_size = 11)
  })

  # Simple PSI for one or two key features
  compute_psi_numeric <- function(train_vec, test_vec, bins = 10) {
    tv <- train_vec[is.finite(train_vec)]
    sv <- test_vec[is.finite(test_vec)]
    if (length(tv) < 2 || length(sv) < 2) return(NA_real_)
    qs <- stats::quantile(tv, probs = seq(0, 1, length.out = bins + 1), na.rm = TRUE, type = 7)
    # Ensure strictly increasing breaks
    for (i in 2:length(qs)) {
      if (!is.finite(qs[i])) qs[i] <- qs[i - 1]
      if (qs[i] <= qs[i - 1]) qs[i] <- qs[i - 1] + 1e-6
    }
    qmin <- min(tv, na.rm = TRUE)
    qmax <- max(tv, na.rm = TRUE)
    if (!is.finite(qmin) || !is.finite(qmax) || qmin == qmax) return(0)
    qs[1] <- qmin - 1e-8
    qs[length(qs)] <- qmax + 1e-8
    t_bins <- cut(tv, qs, include.lowest = TRUE, right = TRUE)
    s_bins <- cut(sv, qs, include.lowest = TRUE, right = TRUE)
    t_pct <- as.numeric(table(t_bins)) / sum(!is.na(t_bins))
    s_pct <- as.numeric(table(s_bins)) / sum(!is.na(s_bins))
    s_pct[s_pct == 0] <- 1e-6; t_pct[t_pct == 0] <- 1e-6
    sum((s_pct - t_pct) * log(s_pct / t_pct))
  }

  psi_data <- reactive({
    if (is.null(train) || is.null(test)) return(NULL)
    feats <- c("precision_scaled", "data_quality_score_scaled")
    feats <- feats[feats %in% intersect(names(train), names(test))]
    if (length(feats) == 0) return(NULL)
    vals <- lapply(feats, function(f) compute_psi_numeric(train[[f]], test[[f]]))
    data.frame(Feature = feats, PSI = unlist(vals))
  })
  output$psi_table <- renderTable({
    df <- psi_data(); if (is.null(df)) return(NULL)
    df$Flag <- cut(df$PSI, breaks = c(-Inf, 0.1, 0.2, 0.3, Inf), labels = c("green", "green/amber", "amber", "red"))
    df
  }, rownames = FALSE)
}

shinyApp(ui, server)
