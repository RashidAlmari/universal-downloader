// ============================================
// أداة تحميل الوسائط - Backend Server
// ============================================

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// 1. Health Check Endpoint
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// ============================================
// 2. Analyze Link Endpoint
// ============================================
app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // تحديد المنصة من الرابط
        let platform = 'Unknown';
        let mediaData = {
            url: url,
            title: 'Media Title',
            platform: platform,
            thumbnail: 'https://via.placeholder.com/320x180?text=Media',
            filesize: '50 MB',
            quality: '720p',
            duration: '5:30',
            viewCount: 1000000
        };

        // تحليل الرابط
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            mediaData.platform = 'YouTube';
            mediaData.title = 'YouTube Video';
        } else if (url.includes('instagram.com')) {
            mediaData.platform = 'Instagram';
            mediaData.title = 'Instagram Post';
        } else if (url.includes('tiktok.com')) {
            mediaData.platform = 'TikTok';
            mediaData.title = 'TikTok Video';
            mediaData.duration = '0:30';
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            mediaData.platform = 'Twitter/X';
            mediaData.title = 'Tweet';
        } else if (url.includes('facebook.com')) {
            mediaData.platform = 'Facebook';
            mediaData.title = 'Facebook Video';
        }

        res.json(mediaData);

    } catch (error) {
        console.error('Error analyzing link:', error);
        res.status(500).json({ error: 'Failed to analyze link' });
    }
});

// ============================================
// 3. Download Endpoint
// ============================================
app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // محاكاة التحميل
        const filename = `media_${Date.now()}.mp4`;
        
        // في الواقع، ستحمّل الملف من الخادم
        // هنا نحاكي التحميل
        const downloadUrl = `https://example.com/downloads/${filename}`;

        res.json({
            success: true,
            downloadUrl: downloadUrl,
            filename: filename,
            message: 'Download ready'
        });

    } catch (error) {
        console.error('Error downloading:', error);
        res.status(500).json({ error: 'Failed to download' });
    }
});

// ============================================
// 4. Error Handling
// ============================================
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// 5. Start Server
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`✅ CORS enabled`);
});

export default app;
