const fs = require('fs');

const path = 'C:\\Users\\dani3\\.gemini\\antigravity\\brain\\efb1d704-c379-4765-8ae5-9e1f647a710f\\.system_generated\\steps\\501\\content.md';
const html = fs.readFileSync(path, 'utf8');

// The component code in 21st.dev is usually inside a <script> block as JSON or raw in some data attribute.
const codeMatch = html.match(/"code":"(.*?)"/);
if (codeMatch) {
    let code = codeMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\t/g, '\t');
    
    // Sometimes there are multiple code blocks. We want the one containing React or export.
    const allMatches = [...html.matchAll(/"code":"(.*?)"/g)];
    for (let m of allMatches) {
        let dec = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        if (dec.includes('export function') || dec.includes('export default') || dec.includes('LiquidGlassButton')) {
            console.log('Found Component Code!');
            fs.writeFileSync('src/components/ui/AppleTahoeButton.jsx', dec);
            process.exit(0);
        }
    }
    console.log('Saved first code block (might not be the right one)');
    fs.writeFileSync('src/components/ui/AppleTahoeButton.jsx', code);
} else {
    console.log('Could not find code block in HTML');
}
