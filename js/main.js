const PHOTO_DIR = 'photos';

const deviceMapping = {
    'SONY': 'Sony',
    'OPPO': 'OPPO',
    'DJI': 'DJI'
};

const folderOrder = ['SONY', 'OPPO', 'DJI'];

const devicePhotoList = {
    'SONY': [
        '11.22-14.jpg',
        'IMG_20251122_195108.jpg',
        'IMG_20251227_231909.jpg',
        'IMG_20251227_232453.jpg'
    ],
    'OPPO': [
        'IMG_20250406_184530.jpg',
        'IMG20250405170300.jpg',
        'IMG_20251227_231550.jpg',
        'IMG_20251227_232307.jpg',
        'IMG_20251228_012224.jpg',
        'IMG20250719185609.jpg',
        'IMG_20251227_231447.jpg',
        'IMG_20251227_232009.jpg',
        'IMG_20251227_232511.jpg'
    ],
    'DJI': [
        'IMG_20251002_220141 - 01.jpg',
        'IMG_20251002_220229 - 01.jpg',
        'IMG_20251002_220301.jpg',
        'IMG_20251009_203905.jpg',
        'IMG_20251009_204034.jpg',
        'IMG_20251111_004024.jpg',
        'IMG_20251206_181525 - 01.jpg',
        '航拍2025-1.jpg',
        '航拍2025-2 - 01.jpg',
        '航拍2025-3 - 01.jpg',
        '航拍2025-4.jpg',
        '航拍2025-5.jpg',
        '航拍2025-6.jpg',
        '航拍2025-7.jpg',
        '航拍2025-8.jpg',
        '航拍2025-9.jpg',
        '苏州-3.jpg'
    ]
};

let photos = [];
let currentIndex = 0;
let isAutoPlaying = false;
let autoPlayTimer = null;
let isAlbumOpened = false;
let isTransitioning = false;

const elements = {
    introScreen: document.getElementById('introScreen'),
    introContent: document.getElementById('introContent'),
    openAlbumBtn: document.getElementById('openAlbumBtn'),
    albumScreen: document.getElementById('albumScreen'),
    photoContainer: document.getElementById('photoContainer'),
    photoFrame: document.getElementById('photoFrame'),
    photoImage: document.getElementById('photoImage'),
    currentIndexEl: document.getElementById('currentIndex'),
    totalCountEl: document.getElementById('totalCount'),
    playBtn: document.getElementById('playBtn'),
    playIcon: document.getElementById('playIcon'),
    homeBtn: document.getElementById('homeBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

function init() {
    preparePhotos();
    bindIntroEvents();
    bindAlbumEvents();
    bindTouchEvents();
    
    requestAnimationFrame(() => {
        elements.introScreen.classList.add('active');
    });
    
    setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
    }, 500);
}

// 使用固定种子的随机数生成器，确保每次洗牌结果一致
function fixedRandom(seed) {
    // 简单的线性同余生成器
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

// Fisher-Yates (Knuth) 洗牌算法，使用固定种子确保每次结果一致
function shufflePhotos() {
    // 使用固定种子，确保每次洗牌顺序相同
    const random = fixedRandom(12345);
    
    // 从数组末尾开始，向前遍历
    for (let i = photos.length - 1; i > 0; i--) {
        // 使用固定种子的随机数选择一个索引，范围是[0, i]
        const j = Math.floor(random() * (i + 1));
        // 交换当前元素与随机选中的元素
        [photos[i], photos[j]] = [photos[j], photos[i]];
        // 更新照片的id，保持连续性
        photos[i].id = i + 1;
        photos[j].id = j + 1;
    }
    console.log('Photos shuffled successfully with fixed order:', photos);
}

function preparePhotos() {
    photos = [];
    
    folderOrder.forEach(folder => {
        const fileList = devicePhotoList[folder] || [];
        fileList.forEach(filename => {
            // 对文件名进行URL编码，处理包含空格和中文的情况
            const encodedFilename = encodeURIComponent(filename);
            photos.push({
                id: photos.length + 1,
                filename: filename,
                folder: folder,
                device: deviceMapping[folder] || folder,
                src: `${PHOTO_DIR}/${folder}/${encodedFilename}`
            });
        });
    });
    
    // 执行随机打乱操作
    shufflePhotos();
    
    // 更新照片总数显示
    elements.totalCountEl.textContent = photos.length;
    console.log(`Total photos: ${photos.length}`);
    
    // 输出照片的实际顺序，用于生成正确的说明文字
    console.log('Photo order:');
    photos.forEach((photo, index) => {
        console.log(`${index + 1}. ${photo.filename} (${photo.device})`);
    });
}

function bindIntroEvents() {
    elements.openAlbumBtn.addEventListener('click', openAlbum);
}

function openAlbum(e) {
    if (e) e.preventDefault();
    
    elements.introContent.classList.add('hidden');
    elements.openAlbumBtn.classList.add('hidden');
    
    setTimeout(() => {
        elements.albumScreen.classList.add('visible');
        elements.introScreen.style.display = 'none';
        isAlbumOpened = true;
        showCurrentPhoto();
    }, 600);
}

function showCurrentPhoto() {
    const photo = photos[currentIndex];
    console.log(`Current photo index: ${currentIndex}`);
    console.log(`Photo data:`, photo);
    
    elements.photoImage.src = photo.src;
    elements.photoImage.alt = `照片 ${photo.id}`;
    elements.currentIndexEl.textContent = currentIndex + 1;
    

}

function navigatePhoto(direction) {
    if (isTransitioning) return;
    
    isTransitioning = true;
    const img = elements.photoImage;
    
    // 移除所有动画，直接切换
    img.style.transition = 'none';
    img.style.opacity = '1';
    
    // 直接更新照片，无延迟
    currentIndex += direction;
    if (currentIndex >= photos.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = photos.length - 1;
    
    showCurrentPhoto();
    isTransitioning = false;
}

function nextPhoto() {
    navigatePhoto(1);
}

function prevPhoto() {
    navigatePhoto(-1);
}

function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    
    if (isAutoPlaying) {
        elements.playBtn.classList.add('active');
        elements.playIcon.textContent = '⏸';
        startAutoPlay();
    } else {
        elements.playBtn.classList.remove('active');
        elements.playIcon.textContent = '▶';
        stopAutoPlay();
    }
}

function startAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => {
        if (!isTransitioning) {
            nextPhoto();
        }
    }, 4000);
}

function stopAutoPlay() {
    if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
    }
}

function goHome() {
    stopAutoPlay();
    isAutoPlaying = false;
    elements.playBtn.classList.remove('active');
    elements.playIcon.textContent = '▶';
    
    elements.albumScreen.classList.remove('visible');
    setTimeout(() => {
        elements.introScreen.style.display = 'flex';
        elements.introContent.classList.remove('hidden');
        elements.openAlbumBtn.classList.remove('hidden');
        elements.introScreen.classList.add('active');
        isAlbumOpened = false;
        currentIndex = 0;
    }, 500);
}

// 移除了照片墙功能模块

function bindAlbumEvents() {
    elements.prevBtn.addEventListener('click', prevPhoto);
    elements.nextBtn.addEventListener('click', nextPhoto);
    elements.playBtn.addEventListener('click', toggleAutoPlay);
    elements.homeBtn.addEventListener('click', goHome);
    
    document.addEventListener('keydown', handleKeyPress);
}

function bindTouchEvents() {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    
    const container = elements.albumScreen;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY);
    }, { passive: true });
    
    function handleSwipe(startX, endX, startY, endY) {
        const swipeThreshold = 50;
        const diffX = startX - endX;
        const diffY = Math.abs(startY - endY);
        
        if (diffY > diffX && diffY > 100) return;
        
        if (Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0) {
                nextPhoto();
            } else {
                prevPhoto();
            }
        }
    }
}

function handleKeyPress(event) {
    // 只保留主界面的键盘事件处理
    if (event.key === 'ArrowLeft') prevPhoto();
    if (event.key === 'ArrowRight') nextPhoto();
    if (event.key === ' ') {
        event.preventDefault();
        toggleAutoPlay();
    }
}

document.addEventListener('DOMContentLoaded', init);
