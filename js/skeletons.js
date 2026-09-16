// Skeleton loader helpers – all skins
window.Skeletons = {
  showHome(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="text-center pt-6 pb-8">
        <div class="skeleton skeleton-title mx-auto" style="width:180px;height:36px"></div>
        <div class="skeleton skeleton-text mx-auto mt-3" style="width:120px;height:16px"></div>
      </div>
      <div class="flex justify-center gap-5 mb-8">
        ${[1,2,3,4].map(() => `
          <div class="flex flex-col items-center gap-2">
            <div class="skeleton skeleton-circle" style="width:56px;height:56px"></div>
            <div class="skeleton" style="width:40px;height:12px"></div>
          </div>`).join('')}
      </div>
      <div class="mb-3"><div class="skeleton" style="width:80px;height:18px"></div></div>
      ${[1,2,3,4,5,6].map(() => `
        <div class="skeleton-row">
          <div class="skeleton skeleton-logo skeleton-circle"></div>
          <div class="skeleton-lines">
            <div class="skeleton skeleton-text" style="width:70%"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
          <div class="skeleton skeleton-right"></div>
        </div>`).join('')}
    `;
  },

  showTokenList(container, count = 6) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }).map(() => `
      <div class="skeleton-row">
        <div class="skeleton skeleton-logo skeleton-circle"></div>
        <div class="skeleton-lines">
          <div class="skeleton skeleton-text" style="width:65%"></div>
          <div class="skeleton skeleton-text" style="width:35%"></div>
        </div>
        <div class="skeleton skeleton-right"></div>
      </div>`).join('');
  },

  showActivity(container, count = 5) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }).map(() => `
      <div class="skeleton-row py-3">
        <div class="skeleton skeleton-circle" style="width:40px;height:40px"></div>
        <div class="skeleton-lines">
          <div class="skeleton skeleton-text" style="width:55%"></div>
          <div class="skeleton skeleton-text" style="width:40%"></div>
        </div>
        <div class="skeleton skeleton-right"></div>
      </div>`).join('');
  },

  showPayPalHome(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="text-center pt-4 pb-6">
        <div class="skeleton skeleton-text mx-auto" style="width:100px;height:14px;margin-bottom:10px"></div>
        <div class="skeleton mx-auto" style="width:200px;height:40px;border-radius:10px"></div>
      </div>
      <div class="skeleton-actions">
        ${[1,2,3,4].map(() => `
          <div class="flex flex-col items-center gap-2">
            <div class="skeleton skeleton-circle" style="width:52px;height:52px"></div>
            <div class="skeleton" style="width:44px;height:11px"></div>
          </div>`).join('')}
      </div>
      <div class="skeleton skeleton-card" style="height:72px;margin:16px 0"></div>
      <div class="mb-3"><div class="skeleton" style="width:90px;height:16px"></div></div>
      ${[1,2,3,4,5].map(() => `
        <div class="skeleton-row">
          <div class="skeleton skeleton-logo skeleton-circle"></div>
          <div class="skeleton-lines">
            <div class="skeleton skeleton-text" style="width:60%"></div>
            <div class="skeleton skeleton-text" style="width:35%"></div>
          </div>
          <div class="skeleton skeleton-right"></div>
        </div>`).join('')}
    `;
  },

  hide(container) {
    // Caller re-renders real content
  }
};
