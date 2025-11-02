from __future__ import annotations

from typing import Dict, Any, List


def summarize_episode_metrics(rewards: List[float], info: Dict[str, Any] | None = None) -> Dict[str, float]:
    total = float(sum(rewards))
    mean = float(total / len(rewards)) if rewards else 0.0
    result = {
        "cumulative_reward": total,
        "mean_reward": mean,
    }
    if info:
        # Include any domain metrics computed by the env in info
        for key, value in info.items():
            if isinstance(value, (int, float)):
                result[str(key)] = float(value)
    return result


