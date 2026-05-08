const modules = Array.from({ length: 100 }, (_, i) => ({ subjectId: `subject_${i % 10}` }));
const entries = Array.from({ length: 100000 }, (_, i) => ({ subjectId: `subject_${i % 20}`, duration: 1 }));

function runBaseline() {
    const uniqueSubjectIds = [...new Set(modules.map(m => m.subjectId).filter(Boolean))];
    const totalSpentSeconds = entries
        .filter(e => uniqueSubjectIds.includes(e.subjectId))
        .reduce((acc, e) => acc + e.duration, 0);
    return totalSpentSeconds;
}

function runOptimized() {
    const uniqueSubjectIds = new Set(modules.map(m => m.subjectId).filter(Boolean));
    const totalSpentSeconds = entries
        .filter(e => uniqueSubjectIds.has(e.subjectId))
        .reduce((acc, e) => acc + e.duration, 0);
    return totalSpentSeconds;
}

const ITERATIONS = 100;

console.time("Baseline");
for (let i = 0; i < ITERATIONS; i++) {
    runBaseline();
}
console.timeEnd("Baseline");

console.time("Optimized");
for (let i = 0; i < ITERATIONS; i++) {
    runOptimized();
}
console.timeEnd("Optimized");
