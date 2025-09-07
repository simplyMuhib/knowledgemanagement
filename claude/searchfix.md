.search-container {
    padding: 12px 16px;
    background: var(--surface-primary);
    border-bottom: 1px solid var(--surface-tertiary);
    position: relative;
}

.search-input {
    width: 100%;
    padding: 12px 16px 12px 44px; /* Space for search icon */
    font-size: 14px;
    border: 1px solid var(--surface-tertiary);
    border-radius: 12px;
    background: var(--surface-secondary);
    color: var(--text-primary);
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    border-color: var(--accent-teal);
    background: var(--surface-primary);
    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
}

.search-input::placeholder {
    color: var(--text-tertiary);
    font-size: 14px;
}

.search-btn {
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 16px;
    cursor: pointer;
    pointer-events: none; /* Icon is decorative */
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
    .search-input {
        background: #1e293b;
        border-color: #475569;
        color: #cbd5e1;
    }
    
    .search-input:focus {
        background: #0f172a;
        border-color: #0891b2;
    }
    
    .search-input::placeholder {
        color: #64748b;
    }
}
