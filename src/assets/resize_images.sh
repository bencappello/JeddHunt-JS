#!/bin/bash

# Usage: ./resize_images.sh /path/to/images

# Exit immediately if a command exits with a non-zero status
set -e

# Function to display usage
usage() {
    echo "Usage: $0 /path/to/start_directory"
    exit 1
}

# Check if start_dir is provided
if [ -z "$1" ]; then
    usage
fi

start_dir="$1"

# Convert to absolute path
if command -v realpath &> /dev/null; then
    start_dir=$(realpath "$start_dir")
elif command -v readlink &> /dev/null; then
    start_dir=$(readlink -f "$start_dir")
else
    echo "Error: Neither 'realpath' nor 'readlink' is available. Please install one of them and try again."
    exit 1
fi

# Check if start_dir exists and is a directory
if [[ ! -d "$start_dir" ]]; then
    echo "Error: '$start_dir' is not a directory or does not exist."
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v mogrify &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it and try again."
    exit 1
fi

if ! command -v identify &> /dev/null; then
    echo "Error: ImageMagick's 'identify' command is not available. Please install ImageMagick and try again."
    exit 1
fi

# Iterate over top-level directories without underscores
find "$start_dir" -mindepth 1 -maxdepth 1 -type d ! -name "*_*" | while IFS= read -r main_dir; do
    # Remove trailing slash if any
    main_dir="${main_dir%/}"
    
    # Get the base name of main_dir
    main_dir_name=$(basename "$main_dir")
    
    # Define the corresponding _orig directory
    orig_dir="${start_dir}/${main_dir_name}_orig"
    
    # Check if the corresponding _orig directory exists
    if [[ -d "$orig_dir" ]]; then
        echo "Processing folder: '$main_dir' with corresponding folder '$orig_dir'"
        
        # Traverse each image in the main directory and subdirectories
        find "$main_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0 | while IFS= read -r -d '' main_img; do
            # Determine the relative path within main_dir (including subdirectories)
            # This strips the main_dir path from the main_img path
            rel_path="${main_img#$main_dir/}"
            
            # Construct the corresponding image path in the _orig directory
            orig_img="$orig_dir/$rel_path"
            
            # Debugging: Uncomment the following lines to see the path mappings
            # echo "Main Image: $main_img"
            # echo "Relative Path: $rel_path"
            # echo "Original Image: $orig_img"
            
            # Check if the corresponding image exists in the _orig directory
            if [[ -f "$orig_img" ]]; then
                # Get the dimensions of the original image
                dimensions=$(identify -format "%wx%h" "$orig_img")
                width=$(echo "$dimensions" | cut -d'x' -f1)
                height=$(echo "$dimensions" | cut -d'x' -f2)
                
                # Resize the image in the main directory to match the dimensions of the original
                mogrify -resize "${width}x${height}" "$main_img"
                echo "Resized '$main_img' to ${width}x${height} to match '$orig_img'"
            else
                echo "Warning: Corresponding image '$orig_img' does not exist. Skipping '$main_img'."
            fi
        done
    else
        echo "No corresponding '_orig' folder for '$main_dir'. Skipping."
    fi
done
