/* ================================
   YTGRAB - JavaScript Functionality
   ================================ */

// DOM Elements
const urlInput = document.getElementById('urlInput');
const pasteBtn = document.getElementById('pasteBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const downloadStatus = document.getElementById('downloadStatus');
const themeToggle = document.getElementById('themeToggle');
const contactForm = document.getElementById('contactForm');
const faqItems = document.querySelectorAll('.faq-item');
const faqQuestions = document.querySelectorAll('.faq-question');
const navLinks = document.querySelectorAll('.nav-link');
const analysisPanel = document.getElementById('analysisPanel');

let isDarkMode = true;
let currentAnalysis = null;

// ================================
// Theme Toggle
// ================================

themeToggle?.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode');

    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');

    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    isDarkMode = false;
    document.body.classList.add('light-mode');
    const icon = themeToggle?.querySelector('i');
    icon?.classList.remove('fa-moon');
    icon?.classList.add('fa-sun');
}

// ================================
// URL Input - Paste Button
// ================================

pasteBtn?.addEventListener('click', async () => {
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            urlInput.value = text;
            urlInput.focus();

            pasteBtn.style.background = 'rgba(34, 211, 238, 0.3)';
            setTimeout(() => {
                pasteBtn.style.background = '';
            }, 300);
        } else {
            showNotification('Please allow clipboard access or paste manually', 'warning');
        }
    } catch (err) {
        console.error('Failed to read clipboard:', err);
        showNotification('Failed to paste. Please paste manually.', 'error');
    }
});

urlInput?.addEventListener('paste', () => {
    setTimeout(() => {
        showNotification('URL pasted successfully!', 'success');
    }, 100);
});

// ================================
// Analyze Flow
// ================================

analyzeBtn?.addEventListener('click', async () => {
    const url = urlInput.value.trim();

    if (!url) {
        showNotification('Please enter a URL first', 'warning');
        urlInput.focus();
        return;
    }

    if (!isValidURL(url)) {
        showNotification('Please enter a valid URL', 'error');
        urlInput.focus();
        return;
    }

    if (!isYouTubeUrl(url)) {
        showNotification('Only YouTube links are supported', 'error');
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    setDownloadStatus('info', '<i class="fas fa-spinner fa-spin"></i> Analyzing video metadata...');
    renderLoadingState();

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const result = await readJsonResponse(response);
        if (!response.ok) {
            throw new Error(result?.error || 'Unable to analyze video');
        }

        currentAnalysis = { url, ...result?.data };
        renderAnalysisCard(currentAnalysis);
        setDownloadStatus('success', '<i class="fas fa-check-circle"></i> Analysis complete. Choose a download option below.');
        showNotification('Video analyzed successfully. Select a format to download.', 'success');
    } catch (error) {
        renderPlaceholderState();
        setDownloadStatus('error', `<i class="fas fa-exclamation-circle"></i> ${error.message}`);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = 'Analyze Video';
    }
});

analysisPanel?.addEventListener('click', async (event) => {
    const button = event.target.closest('.option-download-btn');
    if (!button || !currentAnalysis) return;

    const { selectedFormat, quality, fileType } = button.dataset;
    const url = currentAnalysis.url;

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Queued';
    setDownloadStatus('loading', '<i class="fas fa-spinner fa-spin"></i> Preparing download...');

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, selectedFormat, quality, fileType })
        });

        const result = await readJsonResponse(response);
        if (!response.ok) {
            throw new Error(result?.error || 'Unable to start download');
        }

        const jobId = result?.data?.id;
        if (!jobId) {
            throw new Error('The server did not return a valid download job.');
        }
        setDownloadStatus('loading', `<i class="fas fa-spinner fa-spin"></i> Download queued. Tracking job ${jobId}...`);
        pollDownloadStatus(jobId);
    } catch (error) {
        button.disabled = false;
        button.innerHTML = 'Download';
        setDownloadStatus('error', `<i class="fas fa-exclamation-circle"></i> ${error.message}`);
    }
});

// ================================
// URL Validation
// ================================

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function isYouTubeUrl(string) {
    try {
        const parsed = new URL(string);
        return parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be');
    } catch (_) {
        return false;
    }
}

function setDownloadStatus(type, message) {
    if (!downloadStatus) return;
    downloadStatus.className = `download-status ${type}`;
    downloadStatus.innerHTML = message;
}

async function readJsonResponse(response) {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return { error: 'The server returned an unexpected response.' };
    }
}

async function pollDownloadStatus(jobId) {
    try {
        const response = await fetch(`/api/status/${jobId}`);
        const result = await readJsonResponse(response);
        if (!response.ok) throw new Error(result?.error || 'Unable to fetch status');

        const job = result?.data;
        if (!job) {
            throw new Error('The server did not return the current job status.');
        }
        setDownloadStatus('loading', `<i class="fas fa-spinner fa-spin"></i> ${job.status} (${job.progress}%)`);

        if (job.status === 'completed') {
            setDownloadStatus('success', `<i class="fas fa-check-circle"></i> Download ready. <a href="/api/file/${job.id}" target="_blank" rel="noopener noreferrer">Download file</a>`);
            return;
        }

        if (job.status === 'failed') {
            throw new Error('Download failed');
        }

        window.setTimeout(() => pollDownloadStatus(jobId), 1000);
    } catch (error) {
        setDownloadStatus('error', `<i class="fas fa-exclamation-circle"></i> ${error.message}`);
    }
}

function renderPlaceholderState() {
    if (!analysisPanel) return;
    analysisPanel.innerHTML = `
        <div class="placeholder-state">
            <div class="analysis-icon">
                <i class="fas fa-magic"></i>
            </div>
            <h3>Ready to analyze</h3>
            <p>Paste a YouTube URL, click Analyze Video, and your premium download options will appear here.</p>
        </div>
    `;
}

function renderLoadingState() {
    if (!analysisPanel) return;
    analysisPanel.innerHTML = `
        <div class="analysis-loading">
            <div class="loading-orb"></div>
            <h3>Analyzing...</h3>
            <p>Pulling video metadata and format options for you.</p>
        </div>
    `;
}

function renderAnalysisCard(data) {
    if (!analysisPanel) return;

    const videoFormats = (data.videoFormats || []).map((item) => `
        <div class="option-row">
            <div>
                <div class="option-title">${item.label}</div>
                <span class="option-meta">${item.size} · ${item.audio || 'Audio included'}</span>
            </div>
            <button class="option-download-btn" data-selected-format="video" data-quality="${item.quality}" data-file-type="${item.fileType}">Download</button>
        </div>
    `).join('');

    const audioFormats = (data.audioFormats || []).map((item) => `
        <div class="option-row">
            <div>
                <div class="option-title">${item.label}</div>
                <span class="option-meta">${item.bitrate} · ${item.size}</span>
            </div>
            <button class="option-download-btn" data-selected-format="audio" data-quality="${item.bitrate}" data-file-type="${item.fileType}">Download</button>
        </div>
    `).join('');

    analysisPanel.innerHTML = `
        <div class="analysis-card">
            <div class="video-meta">
                <img class="video-thumb" src="${data.thumbnail}" alt="${data.title}">
                <div class="meta-copy">
                    <h3>${data.title}</h3>
                    <p>${data.channelName}</p>
                    <div class="meta-stats">
                        <span><i class="fas fa-clock"></i> ${data.duration}</span>
                        <span><i class="fas fa-eye"></i> ${data.views || '—'}</span>
                        <span><i class="fas fa-calendar"></i> ${data.uploadDate || '—'}</span>
                    </div>
                </div>
            </div>

            <div class="option-group">
                <h4>Video</h4>
                ${videoFormats}
            </div>

            <div class="option-group">
                <h4>Audio</h4>
                ${audioFormats}
            </div>
        </div>
    `;
}

// ================================
// FAQ Accordion
// ================================

faqQuestions.forEach((question, index) => {
    question.addEventListener('click', () => {
        const faqItem = faqItems[index];
        const isActive = faqItem.classList.contains('active');

        faqItems.forEach(item => {
            item.classList.remove('active');
        });

        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

faqQuestions.forEach((question, index) => {
    question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            question.click();
        }
    });
});

// ================================
// Contact Form
// ================================

contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const email = formData.get('email') || '';
    const message = formData.get('message') || '';

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    if (message.trim().length < 10) {
        showNotification('Please enter a message with at least 10 characters', 'warning');
        return;
    }

    const submitBtn = contactForm.querySelector('.btn-send');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    setTimeout(() => {
        showNotification('Thank you! Your message has been sent successfully.', 'success');
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message';
    }, 1500);
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ================================
// Notification System
// ================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ================================
// Smooth Scroll Navigation
// ================================

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            const offset = 80;
            const targetPosition = targetSection.offsetTop - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

window.addEventListener('scroll', () => {
    const offset = 100;

    navLinks.forEach(link => {
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            const sectionTop = targetSection.offsetTop - offset;
            const sectionBottom = sectionTop + targetSection.offsetHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                navLinks.forEach(l => l.style.color = '');
                link.style.color = 'var(--color-accent)';
            }
        }
    });
});

// ================================
// Intersection Observer for Animations
// ================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'slideInLeft 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});

// ================================
// CTA Button Handler
// ================================

document.querySelector('.cta-button')?.addEventListener('click', () => {
    const heroSection = document.querySelector('.hero');
    heroSection?.scrollIntoView({ behavior: 'smooth' });
    urlInput?.focus();
});

// ================================
// Social Links (Demo)
// ================================

document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Social link clicked! Redirecting...', 'info');
    });
});

// ================================
// Keyboard Shortcuts
// ================================

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        urlInput?.focus();
    }

    if (e.key === 'Escape') {
        urlInput?.blur();
        document.activeElement?.blur();
    }
});

// ================================
// Demo URL Handler
// ================================

document.querySelector('.demo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    urlInput.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    showNotification('Demo URL loaded! Click "Analyze Video" to continue.', 'info');
    urlInput.focus();
});

// ================================
// Initialization
// ================================

document.addEventListener('DOMContentLoaded', () => {
    renderPlaceholderState();
});

// ================================
// Performance Optimization
// ================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

console.log('%cWelcome to YTGrab!', 'color: #7C3AED; font-size: 24px; font-weight: bold;');
console.log('%cFast, Private, and Clean Video Downloading', 'color: #38BDF8; font-size: 14px;');
console.log('%c🚀 Built with ❤️ for video enthusiasts', 'color: #22D3EE; font-size: 12px;');
