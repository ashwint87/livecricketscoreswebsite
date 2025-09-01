import React, { useState } from 'react';
import '../css/ContactForm.css';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setStatus({ loading: false, success: result.message, error: null });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus({ loading: false, success: null, error: result.message });
      }
    } catch (err) {
      setStatus({ loading: false, success: null, error: 'Something went wrong.' });
    }
  };

  return (
    <div className="contact-form-container">
      <h2>Contact Us</h2>

      <form onSubmit={handleSubmit} className="contact-form">
        <input
          type="text"
          name="name"
          placeholder="Your Name*"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email*"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="subject"
          placeholder="Subject*"
          value={formData.subject}
          onChange={handleChange}
          required
        />

        <textarea
          name="message"
          placeholder="Your Message*"
          rows="6"
          value={formData.message}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={status.loading}>
          {status.loading ? 'Sending...' : 'Send Message'}
        </button>

        {status.success && <p className="success-msg">{status.success}</p>}
        {status.error && <p className="error-msg">{status.error}</p>}
      </form>
    </div>
  );
};

export default ContactForm;
