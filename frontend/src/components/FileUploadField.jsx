import React from 'react';

export default function FileUploadField({ id, label, fileName, placeholder = '未选择任何文件', onChange }) {
  return (
    <div className="field upload-field">
      <span>{label}</span>
      <div className="upload-control">
        <input id={id} className="upload-input" type="file" accept="image/*" onChange={onChange} />
        <label className="upload-button" htmlFor={id}>
          选择文件
        </label>
        <span className={`upload-filename ${fileName ? '' : 'is-empty'}`}>{fileName || placeholder}</span>
      </div>
    </div>
  );
}
