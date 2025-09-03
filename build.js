#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Build script for LinkMind Chrome Extension
console.log('🔨 Building LinkMind Extension...');

// Clean dist folder
if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('🧹 Cleaned dist folder');
}

// Create dist folder structure
const folders = [
    'dist',
    'dist/src/background',
    'dist/src/content', 
    'dist/src/popup',
    'dist/src/sidepanel',
    'dist/src/dashboard',
    'dist/src/services',
    'dist/src/shared',
    'dist/assets/icons'
];

folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

console.log('📁 Created dist folder structure');

// Copy files
function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        files.forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy manifest
fs.copyFileSync('manifest.json', 'dist/manifest.json');
console.log('📄 Copied manifest.json');

// Copy source files
copyRecursive('src', 'dist/src');
console.log('📂 Copied src folder');

// Copy assets
if (fs.existsSync('assets')) {
    copyRecursive('assets', 'dist/assets');
    console.log('🎨 Copied assets folder');
}

// Create package info
const packageInfo = {
    name: 'LinkMind',
    version: '1.0.0',
    description: 'Next-Gen Knowledge Capture Extension',
    built: new Date().toISOString(),
    features: [
        'Intelligent Context Menus',
        'Smart Content Detection',
        'Multi-modal Capture',
        'Research Integration'
    ]
};

fs.writeFileSync('dist/package-info.json', JSON.stringify(packageInfo, null, 2));
console.log('📦 Created package info');

console.log('✅ Build complete! Extension ready in ./dist folder');
console.log('');
console.log('To load in Chrome:');
console.log('1. Open chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select the ./dist folder');
console.log('');
console.log('🎯 LinkMind context menus will be available on right-click!');