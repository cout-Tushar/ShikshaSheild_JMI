// components/EditStudentModal.jsx
import React from "react";

const EditStudentModal = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = React.useState({
    subjects: student?.subjects || [],
    feesPaid: student?.feesPaid || false,
  });

  const handleSubjectChange = (index, field, value) => {
    const updated = [...formData.subjects];
    updated[index][field] = value;
    setFormData({ ...formData, subjects: updated });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Edit Student</h2>

        {formData.subjects.map((subject, index) => (
          <div key={index} className="mb-3 border-b pb-2">
            <input
              type="text"
              value={subject.name}
              onChange={(e) => handleSubjectChange(index, "name", e.target.value)}
              placeholder="Subject"
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              type="number"
              value={subject.attendance}
              onChange={(e) => handleSubjectChange(index, "attendance", e.target.value)}
              placeholder="Attendance"
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              type="number"
              value={subject.marks}
              onChange={(e) => handleSubjectChange(index, "marks", e.target.value)}
              placeholder="Marks"
              className="w-full mb-2 p-2 border rounded"
            />
          </div>
        ))}

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={formData.feesPaid}
            onChange={(e) => setFormData({ ...formData, feesPaid: e.target.checked })}
            className="mr-2"
          />
          <label>Fees Paid</label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;
