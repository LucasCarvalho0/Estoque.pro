const names = [
  "Adesivo Prata 220T",
  "Adesivo Preto 220T",
  "Adesivo test drive",
  "Adesivo X Play P/mala"
];

console.log("--- localeCompare ---");
const loc = [...names].sort((a, b) => a.localeCompare(b));
console.log(loc);

console.log("--- ASCII sort ---");
const ascii = [...names].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
console.log(ascii);
