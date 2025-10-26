from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import onnxruntime as ort
import numpy as np
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ONNX model at startup
try:
    session = ort.InferenceSession("Backend/densenet169_fracture.onnx")
    input_name = session.get_inputs()[0].name
    print(f"Model loaded successfully. Input name: {input_name}")
    print(f"Expected input shape: {session.get_inputs()[0].shape}")
except Exception as e:
    print(f"Error loading model: {e}")
    raise

# ImageNet normalization constants
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Preprocess image for DenseNet-169 model
    
    Args:
        image: PIL Image in RGB format
        
    Returns:
        numpy array of shape (1, 3, 224, 224) with normalized values
    """
    # Resize to 224x224
    image = image.resize((224, 224), Image.BILINEAR)
    
    # Convert to numpy array (H, W, C) with values 0-255
    img_array = np.array(image, dtype=np.float32)
    
    # Normalize to [0, 1]
    img_array = img_array / 255.0
    
    # Apply ImageNet normalization
    img_array = (img_array - IMAGENET_MEAN) / IMAGENET_STD
    
    # Transpose to (C, H, W) format
    img_array = np.transpose(img_array, (2, 0, 1))
    
    # Add batch dimension (1, C, H, W)
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

@app.post("/detect")
async def detect_fracture(file: UploadFile = File(...)):
    """
    Detect fractures in X-ray images using DenseNet-169 ONNX model
    
    Args:
        file: Uploaded image file
        
    Returns:
        Dictionary with probability, fracture_detected flag, and confidence
    """
    try:
        # Read and validate image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocess image
        input_array = preprocess_image(image)
        
        # Run inference
        outputs = session.run(None, {input_name: input_array})
        
        # Extract probability (output shape is (1, 1))
        probability = float(outputs[0].flatten()[0])
        
        # Binary prediction at threshold 0.5
        fracture_detected = probability > 0.3
        
        # Calculate confidence
        confidence = probability if fracture_detected else (1 - probability)
        
        return {
            "probability": probability,
            "fracture_detected": fracture_detected,
            "confidence": confidence
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
