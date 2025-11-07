"""
Auto-selects the best-performing model among PPO, A2C, DQN, REINFORCE.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import numpy as np

from config.rl_config import cfg


def _load_metric_npz(npz_path: Path) -> Optional[float]:
    if not npz_path.exists():
        return None
    try:
        data = np.load(npz_path, allow_pickle=True)
        for key in ("cumulative_reward", "mean_reward", "episode_returns", "rewards"):
            if key in data:
                arr = data[key]
                return float(np.mean(arr)) if getattr(arr, "size", 0) else None
    except Exception:
        return None
    return None


def _load_reinforce_metric(npy_path: Path) -> Optional[float]:
    if not npy_path.exists():
        return None
    try:
        arr = np.load(npy_path, allow_pickle=True)
        return float(np.mean(arr)) if getattr(arr, "size", 0) else None
    except Exception:
        return None


def select_best_model() -> dict:
    if cfg.MODEL_SELECTION_MODE == "force" and cfg.FORCED_ALGO:
        return _forced_selection(cfg.FORCED_ALGO)

    candidates = [
        {
            "algo": "ppo",
            "model": cfg.PPO_MODEL_PATH,
            "metric": _load_metric_npz(cfg.PPO_EVAL_PATH),
            "version": "ppo:best",
        },
        {
            "algo": "a2c",
            "model": cfg.A2C_MODEL_PATH,
            "metric": _load_metric_npz(cfg.A2C_EVAL_PATH),
            "version": "a2c:best",
        },
        {
            "algo": "dqn",
            "model": cfg.DQN_MODEL_PATH,
            "metric": _load_metric_npz(cfg.DQN_EVAL_PATH),
            "version": "dqn:best",
        },
        {
            "algo": "reinforce",
            "model": cfg.REINFORCE_MODEL_PATH,
            "metric": _load_reinforce_metric(cfg.REINFORCE_TRAINING_RESULTS),
            "version": "reinforce:best",
        },
    ]

    valid = [c for c in candidates if c["model"].exists() and c["metric"] is not None]
    if valid:
        return max(valid, key=lambda c: c["metric"])  # highest mean reward

    # fallback: return first existing by preference
    for algo in ("ppo", "a2c", "dqn", "reinforce"):
        for c in candidates:
            if c["algo"] == algo and c["model"].exists():
                c["metric"] = float("-inf")
                return c

    raise FileNotFoundError("No RL models found in configured locations.")


def _forced_selection(algo: str) -> dict:
    mapping = {
        "ppo": {"model": cfg.PPO_MODEL_PATH, "version": "ppo:forced"},
        "a2c": {"model": cfg.A2C_MODEL_PATH, "version": "a2c:forced"},
        "dqn": {"model": cfg.DQN_MODEL_PATH, "version": "dqn:forced"},
        "reinforce": {"model": cfg.REINFORCE_MODEL_PATH, "version": "reinforce:forced"},
    }
    if algo not in mapping:
        raise ValueError(f"Unsupported FORCED_ALGO: {algo}")
    item = mapping[algo]
    if not item["model"].exists():
        raise FileNotFoundError(f"Forced model not found: {item['model']}")
    return {"algo": algo, "model": item["model"], "version": item["version"], "metric": None}


