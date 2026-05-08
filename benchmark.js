const fs = require('fs');
// Mocking window and DOM dependencies if any, but let's just extract the logic.

const numSubjects = 100;
const numEntries = 10000;

const subjects = Array.from({length: numSubjects}, (_, i) => ({ id: `sub_${i}`, name: `Subject ${i}`, color: 'bg-blue-500' }));
const entries = Array.from({length: numEntries}, (_, i) => ({ subjectId: `sub_${i % numSubjects}`, duration: Math.floor(Math.random() * 100) }));

function oldMethod(subjects, entries) {
    const totalSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const maxDuration = Math.max(
        ...subjects.map(s => entries.filter(e => e.subjectId === s.id).reduce((acc, curr) => acc + curr.duration, 0)),
        1
    );

    let sum = 0;
    subjects.forEach(subject => {
        const subjectEntries = entries.filter(e => e.subjectId === subject.id);
        const duration = subjectEntries.reduce((acc, curr) => acc + curr.duration, 0);
        sum += duration;
    });
    return sum + maxDuration;
}

function newMethod(subjects, entries) {
    let totalSeconds = 0;
    const durationBySubject = new Map();

    for (const entry of entries) {
        totalSeconds += entry.duration;
        durationBySubject.set(entry.subjectId, (durationBySubject.get(entry.subjectId) || 0) + entry.duration);
    }

    let maxDuration = 1;
    for (const subject of subjects) {
        const duration = durationBySubject.get(subject.id) || 0;
        if (duration > maxDuration) {
            maxDuration = duration;
        }
    }

    let sum = 0;
    subjects.forEach(subject => {
        const duration = durationBySubject.get(subject.id) || 0;
        sum += duration;
    });
    return sum + maxDuration;
}

console.time('Old Method');
for (let i = 0; i < 100; i++) {
    oldMethod(subjects, entries);
}
console.timeEnd('Old Method');

console.time('New Method');
for (let i = 0; i < 100; i++) {
    newMethod(subjects, entries);
}
console.timeEnd('New Method');
