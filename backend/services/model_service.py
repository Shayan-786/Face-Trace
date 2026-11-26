"""
ModelService — loads the EfficientNet-B0 checkpoint and runs inference
on a single pre-processed face crop tensor.

Expected checkpoint structure
------------------------------
{
    "model_state_dict": <OrderedDict>,
    ... (other keys are ignored)
}

Classifier head (must match training):
    Sequential(
        Dropout(p=0.2, inplace=True),
        Linear(in_features=1280, out_features=3, bias=True),
    )

Class order: ["real", "face_replacement", "face_manipulation"]
"""

import os
from typing import Optional

import torch
import torch.nn as nn
from torchvision import models


CLASSES = ["real", "face_replacement", "face_manipulation"]


class ModelService:
    def __init__(self, model_path: str):
        self._path = model_path
        self._model: Optional[nn.Module] = None
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_error: Optional[str] = None
        self._try_load()

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def _try_load(self) -> None:
        if not os.path.exists(self._path):
            self._load_error = f"Model file not found: {self._path}"
            return
        try:
            model = models.efficientnet_b0(weights=None)
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.2, inplace=True),
                nn.Linear(in_features=1280, out_features=len(CLASSES), bias=True),
            )
            checkpoint = torch.load(
                self._path, map_location=self._device, weights_only=True
            )
            state_dict = checkpoint.get("model_state_dict", checkpoint)
            model.load_state_dict(state_dict)
            model.to(self._device)
            model.eval()
            self._model = model
        except Exception as exc:  # noqa: BLE001
            self._load_error = str(exc)

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    def status(self) -> dict:
        return {
            "loaded": self._model is not None,
            "device": str(self._device),
            "classes": CLASSES if self._model else None,
            "error": self._load_error,
        }

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict(self, tensor: "torch.Tensor") -> dict:
        """
        Run inference on a single preprocessed face-crop tensor.

        Parameters
        ----------
        tensor : torch.Tensor
            Shape (1, 3, 224, 224), already normalised with ImageNet stats.

        Returns
        -------
        dict with keys: class_name, confidence, probabilities
        """
        if self._model is None:
            raise RuntimeError(
                f"Model is not loaded. {self._load_error or 'Unknown error.'}"
            )

        tensor = tensor.to(self._device)
        with torch.no_grad():
            logits = self._model(tensor)          # (1, 3)
            probs = torch.softmax(logits, dim=1)  # (1, 3)

        probs_list = probs.squeeze(0).tolist()
        idx = int(torch.argmax(probs).item())

        return {
            "class_name": CLASSES[idx],
            "confidence": round(probs_list[idx] * 100, 2),
            "probabilities": {
                cls: round(p * 100, 2)
                for cls, p in zip(CLASSES, probs_list)
            },
        }
