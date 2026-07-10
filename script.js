/* ================================
   YTGRAB - JavaScript Functionality
   ================================ */

// DOM Elements
const urlInput = document.getElementById('urlInput');
const pasteBtn = document.getElementById('pasteBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelect = document.getElementById('formatSelect');
const qualitySelect = document.getElementById('qualitySelect');
const downloadStatus = document.getElementById('downloadStatus');
const themeToggle = document.getElementById('themeToggle');
const contactForm = document.getElementById('contactForm');
const faqItems = document.querySelectorAll('.faq-item');
const faqQuestions = document.querySelectorAll('.faq-question');
const navLinks = document.querySelectorAll('.nav-link');

// ================================
// Theme Toggle
// ================================

let isDarkMode = true; // Default to dark mode

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode');
    
    // Update icon
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    
    // Save preference
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Load saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    isDarkMode = false;
    document.body.classList.add('light-mode');
    const icon = themeToggle.querySelector('i');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

// ================================
// URL Input - Paste Button
// ================================

pasteBtn.addEventListener('click', async () => {
    try {
        // Try to use the Clipboard API
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            urlInput.value = text;
            urlInput.focus();
            
            // Visual feedback
            pasteBtn.style.background = 'rgba(34, 211, 238, 0.3)';
            setTimeout(() => {
                pasteBtn.style.background = '';
            }, 300);
        } else {
            // Fallback for older browsers
            showNotification('Please allow clipboard access or paste manually', 'warning');
        }
    } catch (err) {
        console.error('Failed to read clipboard:', err);
        showNotification('Failed to paste. Please paste manually.', 'error');
    }
});

// Allow pasting via Ctrl+V in input
urlInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        showNotification('URL pasted successfully!', 'success');
    }, 100);
});

// ================================
// Analyze Button
// ================================

analyzeBtn.addEventListener('click', () => {
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
    
    // Simulate analysis
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    
    setTimeout(() => {
        showNotification('Video analyzed successfully! Ready to download.', 'success');
        updatePreviewCard(url);
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = 'Analyze Video';
    }, 1500);
});

// ================================
// Download Handler
// ================================

downloadBtn?.addEventListener('click', async () => {
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

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
    setDownloadStatus('loading', '<i class="fas fa-spinner fa-spin"></i> Preparing download...');

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                format: formatSelect.value,
                quality: qualitySelect.value
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Unable to start download');
        }

        const jobId = result.data.id;
        setDownloadStatus('loading', `<i class="fas fa-spinner fa-spin"></i> Download queued. Tracking job ${jobId}...`);
        pollDownloadStatus(jobId);
    } catch (error) {
        setDownloadStatus('error', `<i class="fas fa-exclamation-circle"></i> ${error.message}`);
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = 'Download';
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

async function pollDownloadStatus(jobId) {
    try {
        const response = await fetch(`/api/status/${jobId}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to fetch status');

        const job = result.data;
        setDownloadStatus('loading', `<i class="fas fa-spinner fa-spin"></i> ${job.status} (${job.progress}%)`);

        if (job.status === 'completed') {
            setDownloadStatus('success', `<i class="fas fa-check-circle"></i> Download ready. <a href="/api/file/${job.id}" target="_blank" rel="noopener noreferrer">Download file</a>`);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = 'Download';
            return;
        }

        if (job.status === 'failed') {
            throw new Error('Download failed');
        }

        window.setTimeout(() => pollDownloadStatus(jobId), 1000);
    } catch (error) {
        setDownloadStatus('error', `<i class="fas fa-exclamation-circle"></i> ${error.message}`);
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = 'Download';
    }
}

// ================================
// Update Preview Card
// ================================

function updatePreviewCard(url) {
    const videoTitle = extractDomain(url);
    const previewInfo = document.querySelector('.preview-info');
    
    if (previewInfo) {
        previewInfo.innerHTML = `
            <h3>${videoTitle}</h3>
            <p>Ready to download</p>
        `;
    }
}

// Extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'Video';
    }
}

// ================================
// FAQ Accordion
// ================================

faqQuestions.forEach((question, index) => {
    question.addEventListener('click', () => {
        const faqItem = faqItems[index];
        const isActive = faqItem.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Allow keyboard navigation for FAQ
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

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name') || 'User';
    const email = formData.get('email') || '';
    const message = formData.get('message') || '';
    
    // Validate email
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (message.trim().length < 10) {
        showNotification('Please enter a message with at least 10 characters', 'warning');
        return;
    }
    
    // Simulate form submission
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

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ================================
// Notification System
// ================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add styles dynamically
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
    
    // Add animation
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
    
    // Remove after 3 seconds
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
            const offset = 80; // Navbar height
            const targetPosition = targetSection.offsetTop - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ================================
// Active Nav Link Highlighting
// ================================

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

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});

// ================================
// CTA Button Handler
// ================================

document.querySelector('.cta-button').addEventListener('click', () => {
    const heroSection = document.querySelector('.hero');
    heroSection.scrollIntoView({ behavior: 'smooth' });
    urlInput.focus();
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
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        urlInput.focus();
    }
    
    // Escape to close any modals or clear focus
    if (e.key === 'Escape') {
        urlInput.blur();
        document.activeElement.blur();
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
    console.log('YTGrab website loaded successfully!');
    
    // Add any additional initialization here
    
    // Show welcome notification (optional)
    // showNotification('Welcome to YTGrab!', 'success');
});

// ================================
// Performance Optimization
// ================================

// Lazy load images (if any)
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

// ================================
// Console Welcome Message
// ================================

console.log('%cWelcome to YTGrab!', 'color: #7C3AED; font-size: 24px; font-weight: bold;');
console.log('%cFast, Private, and Clean Video Downloading', 'color: #38BDF8; font-size: 14px;');
console.log('%c🚀 Built with ❤️ for video enthusiasts', 'color: #22D3EE; font-size: 12px;');
