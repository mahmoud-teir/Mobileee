const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('app/api').concat(walk('components'));
let count = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content
    .replace(/['"](\.\.\/)+lib\/([^'"]+)['"]/g, "'@/lib/$2'")
    .replace(/['"](\.\.\/)+models\/([^'"]+)['"]/g, "'@/models/$2'")
    .replace(/['"](\.\.\/)+components\/([^'"]+)['"]/g, "'@/components/$2'");
  
  if (newContent !== content) {
    fs.writeFileSync(f, newContent);
    console.log('Fixed imports in', f);
    count++;
  }
});

console.log('Total files fixed:', count);
