import React, { useState } from 'react';
import axios from 'axios';
import './ProfileActions.css';

function ProfileActions({ profileUser, currentUser, isBlocked: initialBlocked, onBlock, onReport }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    if (!reportReason) {
      alert('Шалтгаан сонгоно уу');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reports/user/${profileUser._id}`,
        { reason: reportReason, description: reportDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Report амжилттай илгээгдлээ. Баярлалаа!');
      setShowReportModal(false);
      setReportReason('spam');
      setReportDescription('');
      
      if (onReport) onReport();
    } catch (error) {
      console.error('Report илгээхэд алдаа:', error);
      alert(error.response?.data?.message || 'Report илгээхэд алдаа гарлаа');
    }
    setSubmitting(false);
  };

  const reasonLabels = {
  spam: 'Спам',
  harassment: 'Дарамт, дээрэлхэлт',
  hate_speech: 'Үзэн ядалтын үг',
  violence: 'Хүчирхийлэл',
  inappropriate: 'Зүй бус контент',
  fake_info: 'Худал мэдээлэл',
  other: 'Бусад'
};

  return (
    <>
      <div className="profile-actions-dropdown">
        <button 
          className="profile-action-btn block-btn"
          onClick={onBlock}
        >
          {initialBlocked ? 'Unblock' : 'Block'}
        </button>

        <button 
          className="profile-action-btn report-btn"
          onClick={() => setShowReportModal(true)}
        >
          Report
      </button>
      </div>

      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => !submitting && setShowReportModal(false)}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3>@{profileUser.username}-г report хийх</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowReportModal(false)}
                disabled={submitting}
              >
                ✕
              </button>
            </div>
            
            <div className="report-modal-body">
              <p className="report-description">
                Энэ хэрэглэгч манай нийгэмлэгийн дүрмийг зөрчсөн бол report хийнэ үү.
              </p>
              
              <label className="report-label">Шалтгаан сонгох:</label>
              <select 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="report-select"
              >
                {Object.entries(reasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              
              <label className="report-label">Нэмэлт тайлбар (заавал биш):</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Тодорхой дэлгэрэнгүй тайлбар..."
                maxLength={500}
                className="report-textarea"
              />
              <div className="char-counter">{reportDescription.length}/500</div>
            </div>
            
            <div className="report-modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowReportModal(false)}
                disabled={submitting}
              >
                Болих
              </button>
              <button 
                className="submit-report-btn"
                onClick={handleReport}
                disabled={submitting}
              >
                {submitting ? 'Илгээж байна...' : 'Report илгээх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileActions;