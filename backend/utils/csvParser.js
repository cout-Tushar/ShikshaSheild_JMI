const fs = require('fs');
const Papa = require('papaparse');

const parseCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const csvData = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const studentsMap = new Map();

          results.data.forEach(row => {
            const email = row.email?.trim();
            const name = row.name?.trim();
            const subject = row.subject?.trim();
            const attendance = parseFloat(row.attendance) || 0;
            const marks = parseFloat(row.marks) || 0;
            const feesPaid = row.feesPaid === 'true' || row.feesPaid === true;

            if (!email || !name || !subject) return;

            if (!studentsMap.has(email)) {
              studentsMap.set(email, {
                email,
                name,
                subjects: [],
                feesPaid
              });
            }

            const student = studentsMap.get(email);
            student.subjects.push({
              name: subject,
              attendance,
              marks
            });
          });

          resolve(Array.from(studentsMap.values()));
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

module.exports = { parseCSV };