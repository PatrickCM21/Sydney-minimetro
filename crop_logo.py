#!/usr/bin/env python3
import os
import sys
import argparse

def check_dependencies():
    """Verify that required packages are installed."""
    missing = []
    try:
        import numpy
    except ImportError:
        missing.append("numpy")
    try:
        import cv2
    except ImportError:
        missing.append("opencv-python (cv2)")
    
    if missing:
        print("Error: Missing required packages.")
        print(f"Please install them using: pip install {' '.join(missing)}")
        sys.exit(1)

def crop_logo(input_path, output_path, method="hough", manual_center=None, manual_radius=None, padding=0, no_crop=False):
    import cv2
    import numpy as np

    # 1. Load the image with alpha channel if present
    print(f"Loading image from: {input_path}")
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Error: Could not read image at {input_path}")
        sys.exit(1)
    
    h, w = img.shape[:2]
    print(f"Image dimensions: {w}x{h} pixels")

    # Ensure 4 channels (RGBA) for output transparency
    if img.shape[2] == 3:
        # Add alpha channel
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # 2. Determine circle center and radius
    cx, cy, r = None, None, None

    if manual_center is not None and manual_radius is not None:
        cx, cy = map(float, manual_center.split(','))
        r = float(manual_radius)
        print(f"Using manual circle coordinates: Center=({cx}, {cy}), Radius={r}")
    else:
        # Automatic detection
        # We want to find the outer circle, which should have a radius close to the outer boundary:
        # i.e., radius >= min(w, h) * 0.47 (approx 451 for a 960x960 image)
        target_min_r = min(w, h) * 0.47
        target_max_r = min(w, h) * 0.52

        # Method 1: Hough Circle Transform (geometry-based)
        print("Detecting circle using Hough Circle Transform...")
        rgb = img[:, :, :3]
        gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
        
        # Hough on unblurred gray image
        circles = cv2.HoughCircles(
            gray, 
            cv2.HOUGH_GRADIENT, 
            dp=1, 
            minDist=100, 
            param1=50, 
            param2=30, 
            minRadius=int(target_min_r), 
            maxRadius=int(target_max_r)
        )
        
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            # Filter circles that are close to the expected size
            valid_circles = [c for c in circles if target_min_r <= c[2] <= target_max_r]
            if valid_circles:
                # Sort by radius descending to get the largest outer circle
                valid_circles = sorted(valid_circles, key=lambda x: x[2], reverse=True)
                cx, cy, r = map(float, valid_circles[0])
                print(f"Detected outer circle via Hough Transform: Center=({cx:.2f}, {cy:.2f}), Radius={r:.2f}")

        # Method 2: Black Color Thresholding (for black outer circle cases)
        if cx is None:
            print("Trying black color thresholding...")
            # Threshold for pixels that are very dark (black circle)
            _, black_mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY_INV)
            contours, _ = cv2.findContours(black_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            best_contour = None
            best_r = 0
            for cnt in contours:
                (x, y), radius = cv2.minEnclosingCircle(cnt)
                if target_min_r <= radius <= target_max_r:
                    if radius > best_r:
                        best_r = radius
                        best_contour = ((x, y), radius)
            
            if best_contour:
                (cx, cy), r = best_contour
                print(f"Detected outer black circle: Center=({cx:.2f}, {cy:.2f}), Radius={r:.2f}")

        # Method 3: Orange Color Thresholding (for orange outer circle cases)
        if cx is None:
            print("Trying orange color thresholding...")
            hsv = cv2.cvtColor(rgb, cv2.COLOR_BGR2HSV)
            lower_orange = np.array([5, 80, 80])
            upper_orange = np.array([25, 255, 255])
            orange_mask = cv2.inRange(hsv, lower_orange, upper_orange)
            contours, _ = cv2.findContours(orange_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            best_contour = None
            best_r = 0
            for cnt in contours:
                (x, y), radius = cv2.minEnclosingCircle(cnt)
                # Orange circle might have a tail (vertical line), so we allow a slightly larger max radius
                if target_min_r <= radius <= target_max_r * 1.1:
                    if radius > best_r:
                        best_r = radius
                        best_contour = ((x, y), radius)
            
            if best_contour:
                (cx, cy), r = best_contour
                # If the radius is inflated by the tail, cap it to the expected maximum outer circle boundary
                expected_max = min(w, h) / 2.0 - 1.0
                if r > expected_max:
                    print(f"Capping inflated orange radius from {r:.2f} to {expected_max:.2f}")
                    r = expected_max
                print(f"Detected outer orange circle: Center=({cx:.2f}, {cy:.2f}), Radius={r:.2f}")

        # Method 4: General non-white contour analysis
        if cx is None:
            print("Trying general non-white contour analysis...")
            # Threshold out the white background
            _, binary = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            best_contour = None
            best_r = 0
            for cnt in contours:
                (x, y), radius = cv2.minEnclosingCircle(cnt)
                if target_min_r <= radius <= target_max_r * 1.1:
                    if radius > best_r:
                        best_r = radius
                        best_contour = ((x, y), radius)
            
            if best_contour:
                (cx, cy), r = best_contour
                expected_max = min(w, h) / 2.0 - 1.0
                if r > expected_max:
                    r = expected_max
                print(f"Detected outer circle via general contour: Center=({cx:.2f}, {cy:.2f}), Radius={r:.2f}")

        # Method 5: Ultimate Fallback to image boundaries
        if cx is None:
            cx, cy = w / 2.0, h / 2.0
            r = min(w, h) / 2.0 - 1.0
            print(f"Could not automatically detect the outer circle. Falling back to default: Center=({cx}, {cy}), Radius={r}")

    # 3. Apply cropping mask
    r += padding
    
    # Create mask
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(mask, (int(cx), int(cy)), int(r), 255, -1)
    
    output_img = img.copy()
    output_img[:, :, 3] = cv2.bitwise_and(output_img[:, :, 3], mask)
    
    if no_crop:
        cropped = output_img
    else:
        # Crop to bounding box of the circle
        x_start = max(0, int(cx - r))
        y_start = max(0, int(cy - r))
        x_end = min(w, int(cx + r))
        y_end = min(h, int(cy + r))
        cropped = output_img[y_start:y_end, x_start:x_end]
    
    # 4. Save result
    print(f"Saving cropped image to: {output_path}")
    cv2.imwrite(output_path, cropped)
    print("Done successfully!")

if __name__ == "__main__":
    check_dependencies()
    
    parser = argparse.ArgumentParser(description="Crop a logo to the outer circular boundary.")
    parser.add_argument("-i", "--input", required=True, help="Path to the input image")
    parser.add_argument("-o", "--output", required=True, help="Path to save the cropped output image")
    parser.add_argument("-m", "--method", choices=["hough", "orange", "contour"], default="hough", 
                        help="Detection method: 'hough' transform, 'orange' color, or 'contour' analysis (default: hough)")
    parser.add_argument("-c", "--center", help="Manual center override as 'x,y' (e.g., '480,480')")
    parser.add_argument("-r", "--radius", help="Manual radius override (e.g., '480')")
    parser.add_argument("-p", "--padding", type=int, default=0, help="Radius padding in pixels (default: 0)")
    parser.add_argument("--no-crop", action="store_true", help="Keep the original image size and only apply transparency mask")
    
    args = parser.parse_args()
    
    crop_logo(
        input_path=args.input,
        output_path=args.output,
        method=args.method,
        manual_center=args.center,
        manual_radius=args.radius,
        padding=args.padding,
        no_crop=args.no_crop
    )
