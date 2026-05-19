import os
import zipfile

def zip_extension():
    extension_dir = "Extension"
    zip_path = "Frontend/public/studysync-extension.zip"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(zip_path), exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # First write the directory entry for icons
        zipf.writestr('icons/', '')
        
        for root, dirs, files in os.walk(extension_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Get relative path for zip entry
                arcname = os.path.relpath(file_path, extension_dir)
                # Convert backslashes to forward slashes for zip standard compatibility
                arcname = arcname.replace('\\', '/')
                zipf.write(file_path, arcname)
                print(f"Added: {arcname}")

if __name__ == "__main__":
    zip_extension()
    print("Extension packaged successfully with standard zip format!")
