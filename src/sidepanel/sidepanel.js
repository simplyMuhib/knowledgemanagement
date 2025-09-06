// LinkMind Enterprise-Standard Side Panel JavaScript

// Progressive disclosure state management
let userEngagementLevel = 0; // 0: First visit, 1: After first save, 2: After 3 saves, 3: Advanced user (5+ saves)
let capturedContent = [];
let currentPageInfo = { title: '', url: '', domain: '' };

// Progressive engagement milestones
const ENGAGEMENT_MILESTONES = {
    FIRST_SAVE: 1,
    MOMENTUM_BUILDER: 3,
    COMMITTED_USER: 5,
    POWER_USER: 10,
    RESEARCHER: 20,
    KNOWLEDGE_MASTER: 50
};

// Habit formation tracking
const HABIT_TRACKING = {
    DAILY_STREAK_KEY: 'dailyStreak',
    LAST_SAVE_DATE_KEY: 'lastSaveDate',
    TOTAL_DAYS_KEY: 'totalActiveDays',
    HABIT_FORMED_KEY: 'habitFormed'
};

// Initialize enterprise-standard interface
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing enterprise-standard LinkMind sidepanel...');
    
    // Get current page context
    await getCurrentPageContext();
    
    // Initialize progressive disclosure system
    await initializeProgressiveDisclosure();
    
    // Initialize primary CTA functionality
    initializePrimaryCTA();
    
    // Load captured content
    await loadCapturedContent();
    
    // Initialize advanced features based on engagement level
    if (userEngagementLevel >= 2) {
        initializeAdvancedFeatures();
    }
    
    // Listen for new captures from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'NEW_CAPTURE_SAVED') {
            console.log('🆕 New capture received in sidepanel:', message.data);
            handleSuccessfulSave(message.data);
            sendResponse({ received: true });
        }
    });
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            console.log('📦 Storage changed, reloading content...');
            loadCapturedContent();
        }
    });
    
    // ENTERPRISE: Listen for tab changes to update page context
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        console.log('🔄 Tab changed, updating page context...');
        await getCurrentPageContext();
        
        // Update dynamic CTA for new context
        updateDynamicCTA();
        
        // Update context tab counts if advanced features are available
        if (userEngagementLevel >= 2) {
            updateContextTabCounts();
            
            // Refresh current context view
            const activeTab = document.querySelector('.context-tab.active');
            if (activeTab) {
                const context = activeTab.dataset.context;
                applyContextFilter(context);
            }
        }
    });
    
    // Listen for tab URL updates (same tab, new page)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            console.log('🔄 Active tab updated, refreshing page context...');
            await getCurrentPageContext();
            
            // Update dynamic CTA for new context
            updateDynamicCTA();
            
            // Update context tab counts if advanced features are available
            if (userEngagementLevel >= 2) {
                updateContextTabCounts();
                
                // Refresh current context view
                const activeTab = document.querySelector('.context-tab.active');
                if (activeTab) {
                    const context = activeTab.dataset.context;
                    applyContextFilter(context);
                }
            }
        }
    });
});

// ENTERPRISE CRITICAL: Get current page context for smart organization
async function getCurrentPageContext() {
    try {
        // Get active tab information
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            currentPageInfo = {
                title: tab.title || 'Untitled Page',
                url: tab.url || '',
                domain: new URL(tab.url || 'https://example.com').hostname
            };
            
            // Update page context display
            const pageTitle = document.getElementById('currentPageTitle');
            if (pageTitle) {
                pageTitle.textContent = currentPageInfo.title;
            }
            
            console.log('🌐 Current page context:', currentPageInfo);
        }
    } catch (error) {
        console.log('⚠️ Could not get current page context:', error);
        currentPageInfo = {
            title: 'Current Page',
            url: '',
            domain: ''
        };
    }
}

// ENTERPRISE: Progressive Disclosure System
async function initializeProgressiveDisclosure() {
    // Get user engagement level from storage
    const result = await chrome.storage.local.get(['userEngagementLevel', 'saveCount']);
    const saveCount = result.saveCount || 0;
    
    // Determine engagement level based on saves (STRICT enterprise thresholds)
    if (saveCount === 0) {
        userEngagementLevel = 0; // First visit - ONLY show CTA
    } else if (saveCount === 1) {
        userEngagementLevel = 1; // After first save - Show success + basic content
    } else if (saveCount < 5) {
        userEngagementLevel = 2; // After multiple saves - Show context tabs + search
    } else {
        userEngagementLevel = 3; // Advanced user (5+ saves) - Full interface
    }
    
    console.log(`👤 User engagement level: ${userEngagementLevel} (${saveCount} saves)`);
    
    // Show appropriate interface elements
    updateInterfaceVisibility();
}

// ENTERPRISE: Update interface based on engagement level
function updateInterfaceVisibility() {
    const primarySection = document.getElementById('primaryActionSection');
    const successFeedback = document.getElementById('successFeedback');
    const advancedInterface = document.getElementById('advancedInterface');
    const contextTabs = document.getElementById('contextTabs');
    const sectionHeader = document.getElementById('sectionHeader');
    const projectSection = document.getElementById('projectSection');
    
    // Update dynamic CTA messaging based on engagement level
    updateDynamicCTA();
    
    // Level 0: Only show primary CTA
    if (userEngagementLevel === 0) {
        primarySection.style.display = 'block';
        successFeedback.style.display = 'none';
        advancedInterface.style.display = 'none';
        contextTabs.style.display = 'none';
        sectionHeader.style.display = 'none';
        projectSection.style.display = 'none';
    }
    // Level 1: Show success feedback after first save
    else if (userEngagementLevel === 1) {
        primarySection.style.display = 'block';
        advancedInterface.style.display = 'none';
        contextTabs.style.display = 'none';
        sectionHeader.style.display = 'block';
        projectSection.style.display = 'none';
    }
    // Level 2: Show context tabs and basic content management
    else if (userEngagementLevel === 2) {
        primarySection.style.display = 'block';
        advancedInterface.style.display = 'block';
        contextTabs.style.display = 'flex';
        sectionHeader.style.display = 'block';
        projectSection.style.display = 'none';
    }
    // Level 3: Show full interface with project management
    else {
        primarySection.style.display = 'block';
        advancedInterface.style.display = 'block';
        contextTabs.style.display = 'flex';
        sectionHeader.style.display = 'block';
        projectSection.style.display = 'block';
    }
}

// ENTERPRISE: Dynamic CTA messaging based on engagement level and context
async function updateDynamicCTA() {
    const ctaTitle = document.querySelector('.cta-title');
    const ctaSubtitle = document.querySelector('.cta-subtitle');
    
    if (!ctaTitle || !ctaSubtitle) return;
    
    // Get current context and user data
    const result = await chrome.storage.local.get(['capturedContent', 'saveCount']);
    const saveCount = result.saveCount || 0;
    const recentSaves = result.capturedContent || [];
    
    // Check if current page is already saved
    const existingItem = recentSaves.find(item => 
        item.url === currentPageInfo.url || item.pageUrl === currentPageInfo.url
    );
    
    // If page is already saved, show different messaging
    if (existingItem) {
        ctaTitle.textContent = "✅ Already saved";
        ctaSubtitle.textContent = `Saved ${formatRelativeTime(existingItem.timestamp)} • Click to update`;
        console.log(`📋 CTA updated for already-saved page: ${currentPageInfo.url}`);
        return;
    }
    
    // Detect smart project context
    const currentProject = detectSmartProject(currentPageInfo);
    const relatedItems = getRelatedContent(recentSaves, currentPageInfo.domain, currentProject);
    
    // Dynamic messaging based on engagement level
    switch (userEngagementLevel) {
        case 0: // First visit - Loss aversion messaging
            ctaTitle.textContent = "Don't lose this content";
            ctaSubtitle.textContent = "Save intelligently with AI organization";
            break;
            
        case 1: // After first save - Progress building
            ctaTitle.textContent = "Add to your knowledge base";
            ctaSubtitle.textContent = "You're building something great";
            break;
            
        case 2: // Engaged user - Project awareness
            if (currentProject && currentProject !== 'General') {
                ctaTitle.textContent = `Add to ${currentProject} project`;
                ctaSubtitle.textContent = `${relatedItems.length} related items found`;
            } else {
                ctaTitle.textContent = "Quick save";
                ctaSubtitle.textContent = "Auto-tagged and organized";
            }
            break;
            
        case 3: // Power user - Context-aware
            if (relatedItems.length > 0) {
                ctaTitle.textContent = "Continue research";
                ctaSubtitle.textContent = `Connects to ${relatedItems.length} items in ${currentProject}`;
            } else if (currentProject && currentProject !== 'General') {
                ctaTitle.textContent = `Expand ${currentProject}`;
                ctaSubtitle.textContent = "New research direction detected";
            } else {
                ctaTitle.textContent = "Save & organize";
                ctaSubtitle.textContent = "Smart project detection active";
            }
            break;
    }
    
    console.log(`🎯 CTA updated for level ${userEngagementLevel}: "${ctaTitle.textContent}"`);
}

// Helper: Get content related to current page context
function getRelatedContent(allContent, domain, project) {
    if (!allContent || allContent.length === 0) return [];
    
    return allContent.filter(item => {
        // Same domain
        if (item.url && item.url.includes(domain)) return true;
        // Same project
        if (item.intelligence && item.intelligence.project === project) return true;
        // Similar content type
        if (item.pageTitle && currentPageInfo.title && 
            item.pageTitle.toLowerCase().includes(currentPageInfo.title.toLowerCase().split(' ')[0])) return true;
        
        return false;
    }).slice(0, 10); // Limit to 10 most relevant
}

// ENTERPRISE CRITICAL: Primary CTA functionality
function initializePrimaryCTA() {
    const saveCTA = document.getElementById('savePrimaryCTA');
    
    saveCTA?.addEventListener('click', async () => {
        console.log('💾 Primary save CTA clicked');
        
        // Disable button during save
        saveCTA.disabled = true;
        saveCTA.style.opacity = '0.6';
        
        try {
            // Capture current page
            await captureCurrentPage();
            
        } catch (error) {
            console.error('❌ Save failed:', error);
            // Re-enable button
            saveCTA.disabled = false;
            saveCTA.style.opacity = '1';
        }
    });
}

// ENTERPRISE: Capture current page functionality
async function captureCurrentPage() {
    // Check for duplicates first
    const existingData = await chrome.storage.local.get(['capturedContent']);
    const existingContent = existingData.capturedContent || [];
    
    // Look for existing saves of this URL
    const duplicates = existingContent.filter(item => 
        item.url === currentPageInfo.url || item.pageUrl === currentPageInfo.url
    );
    
    if (duplicates.length > 0) {
        // Show duplicate handling options instead of saving
        showDuplicateHandlingModal(duplicates[0]);
        return;
    }
    
    const captureData = {
        id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'page',
        title: currentPageInfo.title,
        content: `Saved from: ${currentPageInfo.title}`,
        url: currentPageInfo.url,
        pageTitle: currentPageInfo.title,
        pageUrl: currentPageInfo.url,
        timestamp: new Date().toISOString(),
        intelligence: {
            contentType: 'page',
            domain: currentPageInfo.domain,
            project: detectSmartProject(currentPageInfo)
        }
    };
    
    // Save to storage
    const updatedContent = [captureData, ...(existingData.capturedContent || [])];
    
    await chrome.storage.local.set({ capturedContent: updatedContent });
    
    // Update save count for engagement level
    const result = await chrome.storage.local.get(['saveCount']);
    const newSaveCount = (result.saveCount || 0) + 1;
    await chrome.storage.local.set({ saveCount: newSaveCount });
    
    console.log('✅ Page saved successfully:', captureData);
    
    // Check for milestone achievements
    await checkAndCelebrateMilestones(newSaveCount);
    
    // Track habit formation and daily streaks
    await trackHabitFormation();
    
    // Trigger success feedback
    handleSuccessfulSave(captureData);
}

// ENTERPRISE: Smart project detection
function detectSmartProject(pageInfo) {
    const domain = pageInfo.domain.toLowerCase();
    const title = pageInfo.title.toLowerCase();
    const url = pageInfo.url.toLowerCase();
    
    // GitHub project detection
    if (domain.includes('github.com')) {
        const match = url.match(/github\.com\/[^\/]+\/([^\/]+)/);
        return match ? match[1].replace(/[-_]/g, ' ') + ' Project' : 'GitHub Project';
    }
    
    // Documentation sites
    if (domain.includes('docs.') || title.includes('documentation')) {
        return 'Documentation';
    }
    
    // Development sites
    if (domain.includes('stackoverflow') || domain.includes('medium.com') || domain.includes('dev.to')) {
        return 'Development';
    }
    
    // React-related
    if (title.includes('react') || url.includes('react')) {
        return 'React Project';
    }
    
    // Default project based on domain
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Research';
}

// ENTERPRISE: Enhanced success feedback with behavioral psychology
async function enhanceSuccessFeedback(captureData) {
    const result = await chrome.storage.local.get(['capturedContent', 'saveCount']);
    const saveCount = result.saveCount || 0;
    const totalItems = (result.capturedContent || []).length;
    
    const successTitle = document.querySelector('.success-title');
    const socialProofText = document.querySelector('.proof-text');
    const viewRelatedBtn = document.getElementById('viewRelatedBtn');
    const continueBtn = document.getElementById('continueBtn');
    
    // Dynamic success messaging based on engagement level
    if (successTitle) {
        switch (userEngagementLevel) {
            case 0: // First save - Celebration + progress building
                successTitle.textContent = "🎉 Your first save! Knowledge journey begins";
                if (socialProofText) socialProofText.textContent = "Join 1,247+ researchers organizing their work";
                break;
                
            case 1: // Building momentum
                successTitle.textContent = `Great! ${saveCount + 1} items in your knowledge base`;
                if (socialProofText) socialProofText.textContent = `You're ahead of 67% of users at this stage`;
                break;
                
            case 2: // Engaged user
                successTitle.textContent = `Excellent! ${totalItems + 1} items organized`;
                if (socialProofText) socialProofText.textContent = `Power users save 15+ items in their first week`;
                break;
                
            case 3: // Advanced user
                successTitle.textContent = `Research machine! ${totalItems + 1} items captured`;
                if (socialProofText) socialProofText.textContent = `Top 10% of researchers in organization level`;
                break;
        }
    }
    
    // Dynamic next action buttons
    if (viewRelatedBtn && continueBtn) {
        const relatedItems = getRelatedContent(result.capturedContent || [], currentPageInfo.domain, captureData.intelligence.project);
        
        if (relatedItems.length > 0) {
            viewRelatedBtn.innerHTML = `<span>🔗 View ${relatedItems.length} related items in ${captureData.intelligence.project}</span>`;
            viewRelatedBtn.style.display = 'block';
        } else {
            viewRelatedBtn.style.display = 'none';
        }
        
        // Context-aware continue button
        switch (userEngagementLevel) {
            case 0:
                continueBtn.innerHTML = `<span>🚀 Save another page to unlock features</span>`;
                break;
            case 1:
                continueBtn.innerHTML = `<span>📚 Keep building your ${captureData.intelligence.project}</span>`;
                break;
            case 2:
                continueBtn.innerHTML = `<span>⚡ Quick save another item</span>`;
                break;
            case 3:
                continueBtn.innerHTML = `<span>🎯 Continue research in ${captureData.intelligence.project}</span>`;
                break;
        }
    }
    
    console.log(`✨ Enhanced success feedback for level ${userEngagementLevel}, ${totalItems + 1} total items`);
}

// ENTERPRISE: Transform CTA after success to maintain engagement flow
async function transformCTAAfterSuccess(captureData) {
    const ctaTitle = document.querySelector('.cta-title');
    const ctaSubtitle = document.querySelector('.cta-subtitle');
    const saveCTA = document.getElementById('savePrimaryCTA');
    
    if (!ctaTitle || !ctaSubtitle || !saveCTA) return;
    
    // Get current data for context
    const result = await chrome.storage.local.get(['capturedContent', 'saveCount']);
    const saveCount = (result.saveCount || 0) + 1; // Include the just-completed save
    const relatedItems = getRelatedContent(result.capturedContent || [], currentPageInfo.domain, captureData.intelligence.project);
    
    // Add subtle success glow animation to CTA
    saveCTA.style.transition = 'all 0.5s ease';
    saveCTA.style.boxShadow = '0 6px 25px rgba(34, 197, 94, 0.3), 0 0 0 2px rgba(34, 197, 94, 0.1)';
    
    // Brief success state transformation (2 seconds)
    ctaTitle.textContent = "✨ Successfully saved!";
    ctaSubtitle.textContent = "Ready for your next discovery?";
    
    // Then transition to engagement-appropriate messaging
    setTimeout(() => {
        // Remove success glow
        saveCTA.style.boxShadow = '';
        
        // Context-aware next action messaging
        if (userEngagementLevel === 0) {
            ctaTitle.textContent = "🎯 Keep the momentum going";
            ctaSubtitle.textContent = "Save another page to unlock smart features";
        } else if (userEngagementLevel === 1) {
            if (relatedItems.length > 0) {
                ctaTitle.textContent = "🔗 Build your collection";
                ctaSubtitle.textContent = `Add to your ${captureData.intelligence.project} research`;
            } else {
                ctaTitle.textContent = "📚 Expand your knowledge";
                ctaSubtitle.textContent = "Discover new connections";
            }
        } else if (userEngagementLevel >= 2) {
            if (relatedItems.length > 2) {
                ctaTitle.textContent = "🚀 You're on a roll!";
                ctaSubtitle.textContent = `${relatedItems.length} related items in ${captureData.intelligence.project}`;
            } else {
                ctaTitle.textContent = "⚡ Power save";
                ctaSubtitle.textContent = "Quick capture, smart organization";
            }
        }
        
        // After 3 more seconds, return to standard dynamic CTA
        setTimeout(() => {
            updateDynamicCTA();
        }, 3000);
        
    }, 2000);
    
    console.log(`🎯 CTA transformed after success for level ${userEngagementLevel}`);
}

// ENTERPRISE: Progressive engagement milestone system
async function checkAndCelebrateMilestones(newSaveCount) {
    const result = await chrome.storage.local.get(['milestonesAchieved', 'lastMilestone']);
    const achievedMilestones = result.milestonesAchieved || [];
    const lastMilestone = result.lastMilestone || 0;
    
    // Check if we've hit a new milestone
    const currentMilestones = Object.values(ENGAGEMENT_MILESTONES).filter(milestone => 
        newSaveCount >= milestone && !achievedMilestones.includes(milestone)
    );
    
    if (currentMilestones.length > 0) {
        const highestNew = Math.max(...currentMilestones);
        
        // Update achieved milestones
        const updatedAchieved = [...achievedMilestones, ...currentMilestones];
        await chrome.storage.local.set({ 
            milestonesAchieved: updatedAchieved, 
            lastMilestone: highestNew 
        });
        
        // Show milestone celebration
        setTimeout(() => showMilestoneCelebration(highestNew, newSaveCount), 1000);
        
        console.log(`🏆 Milestone achieved: ${highestNew} saves!`);
        return highestNew;
    }
    
    return null;
}

// ENTERPRISE: Milestone celebration with escalating investment
function showMilestoneCelebration(milestone, totalSaves) {
    // Create milestone modal
    const modal = document.createElement('div');
    modal.className = 'milestone-modal';
    modal.innerHTML = `
        <div class="milestone-content">
            <div class="milestone-celebration">
                ${getMilestoneCelebration(milestone)}
            </div>
            <div class="milestone-rewards">
                ${getMilestoneRewards(milestone)}
            </div>
            <button class="milestone-continue">
                ${getMilestoneCTA(milestone)}
            </button>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000;
        background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.querySelector('.milestone-content').style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; padding: 30px; border-radius: 16px; text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 400px; 
        animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener for continue button
    const continueBtn = modal.querySelector('.milestone-continue');
    continueBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    }, 8000);
    
    // Track milestone achievement
    trackConversionEvent('milestone_achieved', {
        milestone: milestone,
        totalSaves: totalSaves,
        engagementLevel: userEngagementLevel
    });
}

// Helper: Get milestone-specific celebration content
function getMilestoneCelebration(milestone) {
    const celebrations = {
        1: `<h2>🎉 First Save Achieved!</h2><p>Welcome to the LinkMind community! You've taken the first step toward organized knowledge.</p>`,
        3: `<h2>🚀 Momentum Builder!</h2><p>3 saves down! You're building something great. Features are unlocking for you.</p>`,
        5: `<h2>💎 Committed User!</h2><p>5 saves! You're in the top 40% of users. Advanced features are now available.</p>`,
        10: `<h2>⚡ Power User Status!</h2><p>10 saves! You're crushing it. Smart project detection is getting smarter.</p>`,
        20: `<h2>🧠 Research Master!</h2><p>20 saves! You're building a serious knowledge base. Top 10% of users!</p>`,
        50: `<h2>👑 Knowledge Master!</h2><p>50 saves! You've mastered the art of information organization. Elite status!</p>`
    };
    return celebrations[milestone] || `<h2>🏆 Milestone Achieved!</h2><p>${milestone} saves and counting! You're incredible!</p>`;
}

// Helper: Get milestone rewards
function getMilestoneRewards(milestone) {
    const rewards = {
        1: `<div class="reward">✨ Unlocked: Smart tagging</div>`,
        3: `<div class="reward">🔍 Unlocked: Advanced search</div><div class="reward">📊 Unlocked: Usage insights</div>`,
        5: `<div class="reward">🎯 Unlocked: Project management</div><div class="reward">🔗 Unlocked: Smart connections</div>`,
        10: `<div class="reward">⚡ Unlocked: Quick actions</div><div class="reward">🤖 Enhanced AI organization</div>`,
        20: `<div class="reward">🧠 Unlocked: Research insights</div><div class="reward">📈 Advanced analytics</div>`,
        50: `<div class="reward">👑 Elite features unlocked</div><div class="reward">🎖️ VIP support access</div>`
    };
    return rewards[milestone] || `<div class="reward">🏆 Special features unlocked!</div>`;
}

// Helper: Get milestone-specific CTA
function getMilestoneCTA(milestone) {
    const ctas = {
        1: "🚀 Save another to unlock more!",
        3: "🎯 Keep building your knowledge!",
        5: "💎 Explore advanced features!",
        10: "⚡ You're unstoppable!",
        20: "🧠 Master researcher mode!",
        50: "👑 Continue your mastery!"
    };
    return ctas[milestone] || "🎉 Keep achieving!";
}

// ENTERPRISE: Habit formation tracking and streaks
async function trackHabitFormation() {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get([
        HABIT_TRACKING.DAILY_STREAK_KEY,
        HABIT_TRACKING.LAST_SAVE_DATE_KEY,
        HABIT_TRACKING.TOTAL_DAYS_KEY,
        HABIT_TRACKING.HABIT_FORMED_KEY
    ]);
    
    const currentStreak = result[HABIT_TRACKING.DAILY_STREAK_KEY] || 0;
    const lastSaveDate = result[HABIT_TRACKING.LAST_SAVE_DATE_KEY] || null;
    const totalActiveDays = result[HABIT_TRACKING.TOTAL_DAYS_KEY] || 0;
    const habitFormed = result[HABIT_TRACKING.HABIT_FORMED_KEY] || false;
    
    let newStreak = currentStreak;
    let newTotalDays = totalActiveDays;
    let streakBroken = false;
    
    if (lastSaveDate !== today) {
        // First save of the day
        const lastDate = new Date(lastSaveDate || today);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            // Consecutive day - increase streak
            newStreak = currentStreak + 1;
            newTotalDays = totalActiveDays + 1;
        } else if (daysDiff === 0) {
            // Same day - no change
            return { streak: currentStreak, isNewDay: false };
        } else {
            // Streak broken - reset to 1
            newStreak = 1;
            newTotalDays = totalActiveDays + 1;
            streakBroken = daysDiff > 1 && currentStreak > 0;
        }
        
        // Update storage
        await chrome.storage.local.set({
            [HABIT_TRACKING.DAILY_STREAK_KEY]: newStreak,
            [HABIT_TRACKING.LAST_SAVE_DATE_KEY]: today,
            [HABIT_TRACKING.TOTAL_DAYS_KEY]: newTotalDays,
            [HABIT_TRACKING.HABIT_FORMED_KEY]: newStreak >= 7 || habitFormed
        });
        
        console.log(`📅 Habit tracking: ${newStreak} day streak, ${newTotalDays} total days`);
        
        // Show streak celebration for significant milestones
        if (newStreak === 3 || newStreak === 7 || newStreak === 14 || newStreak % 30 === 0) {
            setTimeout(() => showStreakCelebration(newStreak, newTotalDays), 2000);
        }
        
        // Show streak broken warning if applicable
        if (streakBroken) {
            setTimeout(() => showStreakBrokenMessage(currentStreak), 1500);
        }
        
        return { streak: newStreak, isNewDay: true, streakBroken };
    }
    
    return { streak: currentStreak, isNewDay: false };
}

// ENTERPRISE: Streak celebration for habit formation
function showStreakCelebration(streak, totalDays) {
    const modal = document.createElement('div');
    modal.className = 'streak-modal';
    modal.innerHTML = `
        <div class="streak-content">
            <div class="streak-fire">🔥</div>
            <h2>${streak} Day Streak!</h2>
            <p>${getStreakMessage(streak)}</p>
            <div class="streak-stats">
                <div class="stat">
                    <div class="stat-number">${streak}</div>
                    <div class="stat-label">Days</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${totalDays}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${Math.floor((streak / totalDays) * 100)}%</div>
                    <div class="stat-label">Consistency</div>
                </div>
            </div>
            <button class="streak-continue">
                ${getStreakCTA(streak)}
            </button>
        </div>
    `;
    
    // Style the modal
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1001;
        background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.querySelector('.streak-content').style.cssText = `
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
        color: white; padding: 30px; border-radius: 16px; text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4); max-width: 350px; 
        animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener for continue button
    const continueBtn = modal.querySelector('.streak-continue');
    continueBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    }, 6000);
    
    // Track streak achievement
    trackConversionEvent('streak_achieved', {
        streak: streak,
        totalDays: totalDays,
        engagementLevel: userEngagementLevel
    });
}

// Helper: Get streak-specific messages
function getStreakMessage(streak) {
    if (streak === 3) return "You're building a habit! 🎯";
    if (streak === 7) return "One week strong! Habit forming! 💪";
    if (streak === 14) return "Two weeks! You're unstoppable! 🚀";
    if (streak === 30) return "One month! Habit mastered! 👑";
    if (streak >= 100) return "Legend status! 100+ days! 🏆";
    return `${streak} days of consistent knowledge building! 🎉`;
}

// Helper: Get streak-specific CTAs
function getStreakCTA(streak) {
    if (streak < 7) return "🔥 Keep the fire burning!";
    if (streak < 14) return "💪 Habit power activated!";
    if (streak < 30) return "🚀 Unstoppable momentum!";
    return "👑 Legendary consistency!";
}

// ENTERPRISE: Show streak broken message with encouragement
function showStreakBrokenMessage(previousStreak) {
    // Only show for streaks of 3+ days
    if (previousStreak < 3) return;
    
    const notification = document.createElement('div');
    notification.className = 'streak-broken-notification';
    notification.innerHTML = `
        <div class="streak-broken-content">
            <div class="broken-icon">💔</div>
            <div class="broken-text">
                <strong>${previousStreak}-day streak ended</strong>
                <p>No worries! Start a new streak today</p>
            </div>
            <button class="close-notification">✕</button>
        </div>
    `;
    
    // Style notification
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 999;
        background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; 
        padding: 16px; color: #dc2626; animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener for close button
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ENTERPRISE: Duplicate handling modal for smart save management
function showDuplicateHandlingModal(existingItem) {
    const modal = document.createElement('div');
    modal.className = 'duplicate-modal';
    modal.innerHTML = `
        <div class="duplicate-content">
            <div class="duplicate-header">
                <div class="duplicate-icon">📝</div>
                <h2>Page Already Saved</h2>
                <p>This page was saved on ${formatRelativeTime(existingItem.timestamp)}</p>
            </div>
            <div class="duplicate-info">
                <div class="existing-item-preview">
                    <strong>${existingItem.title || existingItem.pageTitle}</strong>
                    <div class="item-meta">
                        <span>📁 ${existingItem.intelligence?.project || 'General'}</span>
                        <span>🕒 ${formatRelativeTime(existingItem.timestamp)}</span>
                    </div>
                </div>
            </div>
            <div class="duplicate-actions">
                <button class="duplicate-btn primary" data-action="update">
                    <span class="btn-icon">🔄</span>
                    <div class="btn-content">
                        <strong>Update Existing</strong>
                        <small>Replace with current version</small>
                    </div>
                </button>
                <button class="duplicate-btn secondary" data-action="new-version">
                    <span class="btn-icon">📋</span>
                    <div class="btn-content">
                        <strong>Save as New</strong>
                        <small>Keep both versions</small>
                    </div>
                </button>
                <button class="duplicate-btn tertiary" data-action="view">
                    <span class="btn-icon">👁️</span>
                    <div class="btn-content">
                        <strong>View Existing</strong>
                        <small>See what you saved</small>
                    </div>
                </button>
            </div>
            <button class="duplicate-close">Cancel</button>
        </div>
    `;
    
    // Style the modal
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1002;
        background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.querySelector('.duplicate-content').style.cssText = `
        background: white; color: #333; padding: 30px; border-radius: 16px; text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 450px; width: 90%;
        animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for all buttons
    modal.addEventListener('click', async (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const closeBtn = e.target.closest('.duplicate-close');
        
        if (action) {
            await handleDuplicateAction(action, existingItem);
            modal.remove();
        } else if (closeBtn) {
            modal.remove();
        }
    });
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    }, 15000);
    
    console.log(`⚠️ Duplicate detected for URL: ${existingItem.url}`);
}

// ENTERPRISE: Handle duplicate action choices
async function handleDuplicateAction(action, existingItem) {
    const existingData = await chrome.storage.local.get(['capturedContent']);
    const existingContent = existingData.capturedContent || [];
    
    switch (action) {
        case 'update':
            // Replace existing item with updated version
            const updatedItem = {
                ...existingItem,
                title: currentPageInfo.title,
                pageTitle: currentPageInfo.title,
                timestamp: new Date().toISOString(),
                intelligence: {
                    ...existingItem.intelligence,
                    project: detectSmartProject(currentPageInfo)
                }
            };
            
            const updatedContent = existingContent.map(item => 
                item.id === existingItem.id ? updatedItem : item
            );
            
            await chrome.storage.local.set({ capturedContent: updatedContent });
            
            // Update save count and trigger success (but don't increment count)
            const result = await chrome.storage.local.get(['saveCount']);
            await checkAndCelebrateMilestones(result.saveCount || 0); // Don't increment for updates
            await trackHabitFormation();
            
            // Show update success message
            showUpdateSuccessMessage(updatedItem);
            break;
            
        case 'new-version':
            // Save as new version with timestamp
            const newVersionData = {
                id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'page',
                title: `${currentPageInfo.title} (${new Date().toLocaleString()})`,
                content: `Saved from: ${currentPageInfo.title}`,
                url: currentPageInfo.url,
                pageTitle: currentPageInfo.title,
                pageUrl: currentPageInfo.url,
                timestamp: new Date().toISOString(),
                intelligence: {
                    contentType: 'page',
                    domain: currentPageInfo.domain,
                    project: detectSmartProject(currentPageInfo)
                }
            };
            
            const newVersionContent = [newVersionData, ...existingContent];
            await chrome.storage.local.set({ capturedContent: newVersionContent });
            
            // Update save count and trigger full success flow
            const saveResult = await chrome.storage.local.get(['saveCount']);
            const newSaveCount = (saveResult.saveCount || 0) + 1;
            await chrome.storage.local.set({ saveCount: newSaveCount });
            
            await checkAndCelebrateMilestones(newSaveCount);
            await trackHabitFormation();
            handleSuccessfulSave(newVersionData);
            break;
            
        case 'view':
            // Open existing item in detail modal
            openContentDetail(existingItem);
            break;
    }
    
    // Track duplicate handling
    trackConversionEvent('duplicate_handled', {
        action: action,
        existingItemAge: Date.now() - new Date(existingItem.timestamp).getTime(),
        engagementLevel: userEngagementLevel
    });
}

// ENTERPRISE: Show update success message
function showUpdateSuccessMessage(updatedItem) {
    const notification = document.createElement('div');
    notification.className = 'update-success-notification';
    notification.innerHTML = `
        <div class="update-success-content">
            <div class="success-icon">✅</div>
            <div class="success-text">
                <strong>Page Updated Successfully</strong>
                <p>Your saved version has been refreshed</p>
            </div>
        </div>
    `;
    
    // Style notification
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 999;
        background: #ecfdf5; border: 1px solid #86efac; border-radius: 8px; 
        padding: 16px; color: #065f46; animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// ENTERPRISE: Enhanced Success Feedback with Psychology
function handleSuccessfulSave(captureData) {
    const primarySection = document.getElementById('primaryActionSection');
    const successFeedback = document.getElementById('successFeedback');
    const successProject = document.getElementById('successProject');
    const viewRelatedBtn = document.getElementById('viewRelatedBtn');
    const continueBtn = document.getElementById('continueBtn');
    
    // Update success message with AI-detected project
    if (successProject) {
        successProject.textContent = `Auto-organized in ${captureData.intelligence.project}`;
    }
    
    // Enhanced success feedback based on engagement level
    enhanceSuccessFeedback(captureData);
    
    // Show success feedback with slide-down animation
    if (successFeedback) {
        successFeedback.style.display = 'block';
        successFeedback.style.animation = 'slideInSuccess 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Auto-hide after 4 seconds (increased for social proof reading time)
        setTimeout(() => {
            successFeedback.style.animation = 'slideOutSuccess 0.3s ease-in';
            setTimeout(() => {
                successFeedback.style.display = 'none';
                
                // Update engagement level and show next interface elements
                updateUserEngagement();
                
                // Transform CTA after success to maintain engagement flow
                transformCTAAfterSuccess(captureData);
            }, 300);
        }, 4000);
    }
    
    // Enhanced related items button with conversion psychology
    if (viewRelatedBtn) {
        viewRelatedBtn.onclick = () => {
            console.log('🔗 View related items clicked - engagement boost');
            
            // Track conversion event
            trackConversionEvent('related_items_clicked', {
                project: captureData.intelligence.project,
                contentType: captureData.type
            });
            
            showRelatedItems(captureData);
            
            // Hide success feedback immediately when user engages
            if (successFeedback) {
                successFeedback.style.display = 'none';
            }
        };
    }
    
    // Continue saving button for habit formation
    if (continueBtn) {
        continueBtn.onclick = () => {
            console.log('🔄 Continue saving clicked - habit formation');
            
            // Track conversion event
            trackConversionEvent('continue_saving_clicked');
            
            // Hide success feedback and return to CTA
            if (successFeedback) {
                successFeedback.style.display = 'none';
            }
            
            // Focus back on primary CTA for habit formation
            const saveCTA = document.getElementById('savePrimaryCTA');
            if (saveCTA) {
                saveCTA.focus();
            }
        };
    }
    
    // Re-enable save button with enhanced visual feedback
    const saveCTA = document.getElementById('savePrimaryCTA');
    if (saveCTA) {
        saveCTA.disabled = false;
        saveCTA.style.opacity = '1';
        
        // Add subtle success pulse animation to CTA
        saveCTA.style.animation = 'successPulse 0.6s ease-out';
        setTimeout(() => {
            saveCTA.style.animation = '';
        }, 600);
    }
    
    // Reload content to show new item
    loadCapturedContent();
}

// ENTERPRISE: Conversion tracking for analytics
function trackConversionEvent(eventName, data = {}) {
    console.log(`📊 Conversion Event: ${eventName}`, data);
    
    // Store conversion events for future analytics integration
    chrome.storage.local.get(['conversionEvents']).then(result => {
        const events = result.conversionEvents || [];
        events.push({
            event: eventName,
            timestamp: new Date().toISOString(),
            data: data,
            userEngagementLevel: userEngagementLevel
        });
        
        chrome.storage.local.set({ conversionEvents: events });
    });
}

// ENTERPRISE: Update user engagement and interface
async function updateUserEngagement() {
    // Recalculate engagement level
    await initializeProgressiveDisclosure();
    
    // Update interface visibility
    updateInterfaceVisibility();
    
    // Initialize advanced features if newly unlocked
    if (userEngagementLevel >= 2) {
        initializeAdvancedFeatures();
    }
}

// ENTERPRISE: Initialize advanced features for engaged users
function initializeAdvancedFeatures() {
    console.log('🎯 Initializing advanced features...');
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize filters  
    initializeFilters();
    
    // Initialize context tabs
    initializeContextTabs();
    
    // Add event listeners for advanced actions
    addAdvancedEventListeners();
}

// ENTERPRISE: Context-aware tabs functionality
function initializeContextTabs() {
    const contextTabs = document.querySelectorAll('.context-tab');
    
    contextTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Update active state
            contextTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const context = e.target.dataset.context;
            console.log('📍 Context switched to:', context);
            
            // Apply context-based filtering
            applyContextFilter(context);
        });
    });
}

// ENTERPRISE: Context-based content filtering
function applyContextFilter(context) {
    let filteredContent = capturedContent;
    
    if (context === 'page') {
        // Show items from same URL
        filteredContent = capturedContent.filter(item => 
            item.url === currentPageInfo.url || 
            item.pageUrl === currentPageInfo.url
        );
    } else if (context === 'domain') {
        // Show items from same domain
        filteredContent = capturedContent.filter(item => {
            const itemDomain = item.intelligence?.domain || 
                               (item.url ? new URL(item.url).hostname : '') ||
                               (item.pageUrl ? new URL(item.pageUrl).hostname : '');
            return itemDomain === currentPageInfo.domain;
        });
    }
    // context === 'all' shows everything (no filtering)
    
    // Update tab counts
    updateContextTabCounts();
    
    // Display filtered content
    displayContent(filteredContent);
}

// ENTERPRISE: Update context tab counts
function updateContextTabCounts() {
    const pageCount = document.getElementById('pageCount');
    const domainCount = document.getElementById('domainCount');
    const allCount = document.getElementById('allCount');
    
    // Count items for each context
    const pageItems = capturedContent.filter(item => 
        item.url === currentPageInfo.url || item.pageUrl === currentPageInfo.url
    ).length;
    
    const domainItems = capturedContent.filter(item => {
        const itemDomain = item.intelligence?.domain || 
                          (item.url ? new URL(item.url).hostname : '') ||
                          (item.pageUrl ? new URL(item.pageUrl).hostname : '');
        return itemDomain === currentPageInfo.domain;
    }).length;
    
    if (pageCount) pageCount.textContent = pageItems;
    if (domainCount) domainCount.textContent = domainItems;
    if (allCount) allCount.textContent = capturedContent.length;
}

// ENTERPRISE: Show related items functionality
function showRelatedItems(captureData) {
    const relatedItems = capturedContent.filter(item => 
        item.id !== captureData.id && (
            item.intelligence?.project === captureData.intelligence?.project ||
            item.intelligence?.domain === captureData.intelligence?.domain
        )
    ).slice(0, 3);
    
    console.log('🔗 Found related items:', relatedItems);
    
    // Switch to appropriate context and display
    if (relatedItems.length > 0) {
        // Show domain context
        const domainTab = document.getElementById('domainTab');
        if (domainTab) {
            domainTab.click();
        }
    }
}

// ENTERPRISE: Advanced event listeners
function addAdvancedEventListeners() {
    // View all button
    const viewAllBtn = document.getElementById('viewAllBtn');
    viewAllBtn?.addEventListener('click', () => {
        console.log('📚 View all clicked');
        // Switch to all context
        const allTab = document.getElementById('allTab');
        if (allTab) {
            allTab.click();
        }
    });
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value;
        console.log('🔍 Search query:', query);
        
        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query ? 'flex' : 'none';
        }
        
        // Will implement actual search in later chunks
        performSearch(query);
    });
    
    searchClear?.addEventListener('click', () => {
        if (searchInput) {
            searchInput.value = '';
            searchClear.style.display = 'none';
            performSearch('');
        }
    });
}

function initializeFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filter = e.target.dataset.filter;
            console.log('📊 Filter applied:', filter);
            
            // Will implement actual filtering in later chunks
            applyFilter(filter);
        });
    });
}

// ENTERPRISE: Load captured content from unified storage
async function loadCapturedContent() {
    try {
        const result = await chrome.storage.local.get(['capturedContent']);
        capturedContent = result.capturedContent || [];
        
        console.log(`📦 Loaded ${capturedContent.length} captured items`);
        
        // Update context tab counts if advanced features are available
        if (userEngagementLevel >= 2) {
            updateContextTabCounts();
        }
        
        // Display content based on current interface level
        if (userEngagementLevel === 0) {
            // First visit - don't show content, just the CTA
            return;
        } else {
            displayContent(capturedContent);
        }
        
    } catch (error) {
        console.error('❌ Failed to load content:', error);
        displayEmptyState();
    }
}

// Display real captured content in the UI
function displayContent(content) {
    console.log('🎨 DisplayContent with:', content?.length, 'items');
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) {
        console.log('❌ ContentGrid not found!');
        return;
    }
    
    if (!content || content.length === 0) {
        displayEmptyState();
        return;
    }
    
    // Clear existing content
    contentGrid.innerHTML = '';
    
    // Display real captured items
    content.forEach((item, i) => {
        console.log(`📋 Card ${i+1}:`, item.content?.substring(0, 30));
        const card = createContentCard(item);
        contentGrid.appendChild(card);
    });
    
    console.log('✅ Displayed', content.length, 'real items');
}

// Create a content card element for captured items
function createContentCard(item) {
    try {
        console.log('🔨 Creating card for:', item.type, item.id);
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = item.id || 'unknown';
        card.dataset.type = item.type || 'unknown';
    
    // Determine card type and icon
    let typeIcon, typeLabel, cardContent = '';
    
    switch (item.type) {
        case 'text':
            typeIcon = getContentTypeIcon(item.intelligence?.contentType || 'text');
            typeLabel = getContentTypeLabel(item.intelligence?.contentType || 'text');
            cardContent = `
                <h4 class="card-title">${truncateText(item.content, 40) || 'Text Capture'}</h4>
                <p class="card-preview">${truncateText(item.content, 100)}</p>
            `;
            break;
        case 'link':
            typeIcon = '🔗';
            typeLabel = 'Bookmark';
            cardContent = `
                <h4 class="card-title">${item.title || item.url}</h4>
                <p class="card-preview">${item.url}</p>
                <div class="card-source">
                    <span class="source-icon">🌐</span>
                    <span class="source-url">${new URL(item.url).hostname}</span>
                </div>
            `;
            break;
        case 'image':
            typeIcon = '🖼️';
            typeLabel = 'Image';
            cardContent = `
                <h4 class="card-title">Image from ${new URL(item.pageUrl).hostname}</h4>
                <p class="card-preview">${item.alt || 'Captured image'}</p>
            `;
            break;
        case 'screenshot':
            typeIcon = '📸';
            typeLabel = 'Screenshot';
            cardContent = `
                ${item.imageData ? 
                    `<div class="screenshot-thumbnail">
                        <img src="${item.imageData}" alt="Screenshot" />
                    </div>` : 
                    `<div class="image-placeholder">
                        <span class="image-icon">🖼️</span>
                        <span class="image-text">Screenshot</span>
                    </div>`
                }
                <h4 class="card-title">${item.title || 'Page Screenshot'}</h4>
                <p class="card-source">From: ${item.url ? new URL(item.url).hostname : 'Unknown'}</p>
            `;
            break;
        case 'page':
            typeIcon = '📄';
            typeLabel = 'Page';
            cardContent = `
                <h4 class="card-title">${item.title || 'Page Capture'}</h4>
                <p class="card-preview">${truncateText(item.selectedText, 100) || 'Full page captured'}</p>
            `;
            break;
        case 'research':
            typeIcon = '🔬';
            typeLabel = 'Research';
            cardContent = `
                <h4 class="card-title">Research: "${item.query}"</h4>
                <p class="card-preview">${truncateText(item.content, 100)}</p>
            `;
            break;
        default:
            typeIcon = '📄';
            typeLabel = 'Content';
            cardContent = `
                <h4 class="card-title">${item.title || 'Captured Content'}</h4>
                <p class="card-preview">${truncateText(item.content || '', 100)}</p>
            `;
    }
    
    const timeAgo = formatTimeAgo(new Date(item.timestamp));
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-type">
                <span class="type-icon">${typeIcon}</span>
                <span class="type-label">${typeLabel}</span>
            </div>
            <span class="card-time">${timeAgo}</span>
        </div>
        ${cardContent}
        <div class="card-tags">
            ${item.intelligence ? `<span class="tag">#${item.intelligence.contentType}</span>` : ''}
            ${item.source ? `<span class="tag">#${item.source}</span>` : ''}
        </div>
        <div class="card-actions">
            <button class="card-action" data-action="view" title="View details">👁️</button>
            <button class="card-action" data-action="edit" title="Edit">✏️</button>
            <button class="card-action" data-action="delete" title="Delete">🗑️</button>
        </div>
    `;
    
        // Add click handler for card
        card.addEventListener('click', () => openContentDetail(item));
        
        return card;
    } catch (error) {
        console.error('❌ Error creating card:', error);
        // Return simple error card
        const errorCard = document.createElement('div');
        errorCard.className = 'content-card error-card';
        errorCard.innerHTML = `
            <div class="card-header">
                <div class="card-type">
                    <span class="type-icon">⚠️</span>
                    <span class="type-label">Error</span>
                </div>
            </div>
            <p class="card-preview">Error loading item: ${item.id}</p>
        `;
        return errorCard;
    }
}

// Add new capture to display immediately
function addNewCaptureToDisplay(captureData) {
    capturedContent.unshift(captureData); // Add to beginning
    
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) return;
    
    // Remove empty state if present
    const emptyState = contentGrid.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create and prepend new card
    const newCard = createContentCard(captureData);
    newCard.classList.add('new-capture'); // Add highlight class
    contentGrid.insertBefore(newCard, contentGrid.firstChild);
    
    // Remove highlight after animation
    setTimeout(() => newCard.classList.remove('new-capture'), 2000);
    
    console.log('✨ Added new capture to display:', captureData.type);
}

// Helper functions
function getContentTypeIcon(contentType) {
    const icons = {
        'code': '💻',
        'quote': '💬',
        'definition': '📚',
        'data': '📊',
        'text': '📝'
    };
    return icons[contentType] || '📝';
}

function getContentTypeLabel(contentType) {
    const labels = {
        'code': 'Code Snippet',
        'quote': 'Quote', 
        'definition': 'Definition',
        'data': 'Data',
        'text': 'Text'
    };
    return labels[contentType] || 'Text';
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function displayEmptyState() {
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) return;
    
    contentGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>No captures yet</h3>
            <p>Right-click on any webpage to start capturing knowledge with LinkMind!</p>
            <div class="empty-actions">
                <button class="quick-action primary" id="refreshPageBtn">
                    <span class="action-icon">🔄</span>
                    <span class="action-label">Refresh Page</span>
                </button>
            </div>
        </div>
    `;
    
    // Add event listener for refresh button
    const refreshBtn = document.getElementById('refreshPageBtn');
    refreshBtn?.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    });
}

function openContentDetail(item) {
    console.log('👁️ Opening content detail for:', item.id);
    
    // Create modal content
    const modalContent = `
        <div class="content-detail-modal">
            <div class="detail-header">
                <h2>${item.title || item.pageTitle || 'Captured Content'}</h2>
                <button class="close-modal">✕</button>
            </div>
            <div class="detail-body">
                <div class="detail-meta">
                    <span class="detail-type">${item.type}</span>
                    <span class="detail-time">${formatTimeAgo(new Date(item.timestamp))}</span>
                    <span class="detail-source">${item.url || item.pageUrl}</span>
                </div>
                ${item.type === 'screenshot' && item.imageData ? 
                    `<div class="detail-image"><img src="${item.imageData}" alt="Screenshot" /></div>` : ''}
                <div class="detail-content">
                    <pre>${item.content || 'No content'}</pre>
                </div>
                ${item.intelligence ? `
                    <div class="detail-tags">
                        <span class="tag">#${item.intelligence.contentType}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeContentDetail();
    });
    
    // Close on close button click
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeContentDetail);
    }
}

function closeContentDetail() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function deleteCapture(itemId) {
    if (!confirm('Delete this capture? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Remove from chrome storage
        await chrome.storage.local.remove(itemId);
        
        // Remove from current content array
        capturedContent = capturedContent.filter(item => item.id !== itemId);
        
        // Refresh display
        displayContent(capturedContent);
        
        showNotification('Capture deleted successfully', 'success');
        console.log('✅ Deleted capture:', itemId);
        
    } catch (error) {
        console.error('❌ Failed to delete capture:', error);
        showNotification('Failed to delete capture', 'error');
    }
}

function editCapture(item) {
    console.log('✏️ Editing capture:', item.id);
    
    // Simple inline editing - create editable content
    const card = document.querySelector(`[data-id="${item.id}"]`);
    if (!card) return;
    
    const titleElement = card.querySelector('.card-title');
    const previewElement = card.querySelector('.card-preview');
    
    if (titleElement) {
        const currentTitle = titleElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'edit-title-input';
        input.style.cssText = `
            width: 100%;
            border: 1px solid #ddd;
            padding: 4px;
            font-size: 13px;
            border-radius: 3px;
        `;
        
        input.addEventListener('blur', () => saveEdit(item.id, 'title', input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit(item.id, 'title', input.value);
            } else if (e.key === 'Escape') {
                titleElement.textContent = currentTitle;
                titleElement.style.display = 'block';
                input.remove();
            }
        });
        
        titleElement.style.display = 'none';
        titleElement.parentNode.insertBefore(input, titleElement);
        input.focus();
        input.select();
    }
}

async function saveEdit(itemId, field, newValue) {
    try {
        // Get current item from storage
        const result = await chrome.storage.local.get(itemId);
        const item = result[itemId];
        
        if (item) {
            // Update the field
            item[field] = newValue;
            
            // Save back to storage
            await chrome.storage.local.set({ [itemId]: item });
            
            // Update local array
            const index = capturedContent.findIndex(c => c.id === itemId);
            if (index !== -1) {
                capturedContent[index][field] = newValue;
            }
            
            // Refresh display
            displayContent(capturedContent);
            
            showNotification('Changes saved', 'success');
        }
    } catch (error) {
        console.error('❌ Failed to save edit:', error);
        showNotification('Failed to save changes', 'error');
    }
}

function handleCardAction(action, item, event) {
    console.log(`🎯 Card action: ${action} for item:`, item.id);
    
    switch(action) {
        case 'view':
            openContentDetail(item);
            break;
        case 'edit':
            editCapture(item);
            break;
        case 'delete':
            deleteCapture(item.id);
            break;
        default:
            console.warn('Unknown card action:', action);
    }
}

function performSearch(query) {
    console.log('🔍 Performing search:', query);
    
    if (!query || query.trim() === '') {
        // If no query, show all content
        displayContent(capturedContent);
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    const searchResults = capturedContent.filter(item => {
        // Search across multiple fields
        const searchText = [
            item.title || '',
            item.pageTitle || '',
            item.content || '',
            item.url || '',
            item.pageUrl || '',
            item.intelligence?.contentType || '',
            item.type || ''
        ].join(' ').toLowerCase();
        
        return searchText.includes(searchTerm);
    });
    
    // Display search results
    displayContent(searchResults);
    
    // Show search status
    if (searchResults.length === 0) {
        showNotification(`No results found for "${query}"`, 'info');
    } else {
        showNotification(`Found ${searchResults.length} results for "${query}"`, 'success');
    }
}

function applyFilter(filter) {
    console.log('📊 Applying filter:', filter);
    
    let filteredContent;
    
    switch(filter) {
        case 'all':
            filteredContent = capturedContent;
            break;
        case 'notes':
            filteredContent = capturedContent.filter(item => 
                ['text', 'page', 'research'].includes(item.type)
            );
            break;
        case 'snippets':
            filteredContent = capturedContent.filter(item => 
                item.type === 'text' && item.intelligence?.contentType === 'code'
            );
            break;
        case 'images':
            filteredContent = capturedContent.filter(item => 
                ['image', 'screenshot'].includes(item.type)
            );
            break;
        default:
            filteredContent = capturedContent;
    }
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Display filtered content
    displayContent(filteredContent);
    
    // Show filter status
    const count = filteredContent.length;
    const filterLabel = filter.charAt(0).toUpperCase() + filter.slice(1);
    showNotification(`${filterLabel}: ${count} items`, 'info');
}

function addEventListeners() {
    // Sync button animation
    document.querySelector('[data-action="sync"]')?.addEventListener('click', (e) => {
        const icon = e.target.querySelector('.sync-icon');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
            setTimeout(() => {
                icon.style.animation = 'none';
            }, 2000);
        }
    });
    
    // Intelligence panel interactions - Hook Model triggers
    document.querySelector('[data-action="knowledge-map"]')?.addEventListener('click', (e) => {
        console.log('🕸️ Opening knowledge graph visualization');
        // Will implement knowledge graph in Day 3-4
        showNotification('Knowledge graph visualization coming soon!', 'info');
    });

    // Discovery alert interactions - Variable rewards
    document.querySelectorAll('.discovery-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            console.log(`💡 Discovery action: ${action}`);
            
            switch(action) {
                case 'explore-connections':
                    showConnectionExplorer();
                    break;
                case 'research-suggestion':
                    showResearchSuggestions();
                    break;
            }
        });
    });

    // Project context toggle (replaces domain context)
    document.querySelector('[data-action="toggle-project"]')?.addEventListener('click', (e) => {
        const projectItems = document.getElementById('projectItems');
        const toggleIcon = e.target.querySelector('.toggle-icon');
        
        if (projectItems && toggleIcon) {
            const isExpanded = projectItems.style.display !== 'none';
            projectItems.style.display = isExpanded ? 'none' : 'block';
            toggleIcon.textContent = isExpanded ? '▶' : '▼';
        }
    });
    
    // Card action handlers (delegated event handling for dynamic content)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.card-action')) {
            e.stopPropagation();
            const action = e.target.dataset.action;
            const card = e.target.closest('.content-card');
            const itemId = card?.dataset.id;
            
            if (itemId) {
                const item = capturedContent.find(item => item.id === itemId);
                if (item) {
                    handleCardAction(action, item, e);
                }
            }
        }
    });
    
    // Quick action handlers
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            console.log(`⚡ Quick action: ${action}`);
        });
    });
}

// Hook Model Helper Functions
function showConnectionExplorer() {
    console.log('🔗 Opening connection explorer');
    // Temporary notification - will be replaced with actual UI
    showNotification('Found 3 connections to your React research!', 'success');
    
    // Hook Model: Investment - user explores connections between their content
    // This creates value and increases switching costs
}

function showResearchSuggestions() {
    console.log('🎯 Showing research suggestions');
    // Temporary notification - will implement real suggestions later
    showNotification('Suggested: "React Performance Optimization Patterns"', 'info');
    
    // Hook Model: Trigger - suggesting next actions based on knowledge gaps
}

function showNotification(message, type = 'info') {
    // Simple notification system (will enhance in Day 7)
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: ${type === 'success' ? '#10b981' : type === 'info' ? '#3b82f6' : '#6b7280'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
window.LinkMindSidepanel = {
    displayContent,
    performSearch,
    applyFilter,
    showConnectionExplorer,
    showResearchSuggestions,
    showNotification
};