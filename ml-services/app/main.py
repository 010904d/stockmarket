from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

app = FastAPI(title="ML Service")

class PredictRequest(BaseModel):
    symbol: str
    start: str = "2020-01-01"
    end: str = "2024-01-01"
    sequence_length: int = 60
    epochs: int = 2
    batch_size: int = 32

@app.post("/predict")
def predict(req: PredictRequest):
    # Download
    df = yf.download(req.symbol, start=req.start, end=req.end, progress=False)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data found for symbol/date range")

    data = df[['Close']].values
    scaler = MinMaxScaler(feature_range=(0,1))
    scaled = scaler.fit_transform(data)

    seq = req.sequence_length
    X, y = [], []
    for i in range(seq, len(scaled)):
        X.append(scaled[i-seq:i, 0])
        y.append(scaled[i, 0])
    if len(X) == 0:
        raise HTTPException(status_code=400, detail="Not enough data for given sequence_length")

    X, y = np.array(X), np.array(y)
    X = X.reshape((X.shape[0], X.shape[1], 1))

    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], 1)),
        LSTM(50),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')

    # Train (small epochs by default)
    model.fit(X_train, y_train, epochs=req.epochs, batch_size=req.batch_size, verbose=0)

    pred = model.predict(X_test)
    pred_prices = scaler.inverse_transform(pred)
    actual_prices = scaler.inverse_transform(y_test.reshape(-1,1))

    # Build recommendations
    threshold = 0.01
    recommendations = []
    for actual, p in zip(actual_prices[:-1], pred_prices[1:]):
        pct_change = (p - actual) / actual
        if pct_change > threshold:
            recommendations.append("Buy")
        elif pct_change < -threshold:
            recommendations.append("Sell")
        else:
            recommendations.append("Hold")

    results = []
    for a, p, r in zip(actual_prices[1:].flatten(), pred_prices[1:].flatten(), recommendations):
        results.append({"actual": float(a), "predicted": float(p), "recommendation": r})

    return {"symbol": req.symbol, "results": results}
