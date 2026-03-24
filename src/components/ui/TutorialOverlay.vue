<template>
  <Teleport to="body">
    <Transition name="tutorial-fade">
      <div v-if="isVisible" class="tutorial-overlay" @click.self="skip">

        <!-- Progress dots -->
        <div class="tutorial-dots">
          <button
            v-for="(_, i) in total"
            :key="i"
            class="dot"
            :class="{ active: i === currentStep }"
            @click="$emit('goto', i)"
          ></button>
        </div>

        <!-- Card -->
        <Transition name="step-slide" mode="out-in">
          <div :key="currentStep" class="tutorial-card">

            <!-- Close -->
            <button class="close-btn" @click="skip" title="Skip tutorial">
              <i class="fas fa-times"></i>
            </button>

            <!-- Icon -->
            <div class="step-icon">{{ step().icon || '💡' }}</div>

            <!-- Title / progress -->
            <div class="step-progress">
              Step {{ currentStep + 1 }} of {{ total }}
            </div>
            <h2 class="step-title">{{ step().title }}</h2>
            <p  class="step-text">{{ step().text }}</p>

            <!-- Actions -->
            <div class="step-actions">
              <button v-if="currentStep > 0" class="btn-prev" @click="prev">
                <i class="fas fa-arrow-left"></i> Back
              </button>
              <button
                class="btn-next"
                @click="next"
              >
                {{ currentStep === total - 1 ? 'Got it! 🎉' : 'Next' }}
                <i v-if="currentStep < total - 1" class="fas fa-arrow-right"></i>
              </button>
            </div>

            <!-- Skip link -->
            <button class="skip-link" @click="skip">
              Skip tutorial
            </button>
          </div>
        </Transition>

        <!-- Tutorial title (top) -->
        <div class="tutorial-header-label">{{ title }}</div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  isVisible:   { type: Boolean, required: true },
  currentStep: { type: Number,  required: true },
  total:       { type: Number,  required: true },
  title:       { type: String,  default: '' },
  step:        { type: Function, required: true }
})

const emit = defineEmits(['next', 'prev', 'skip', 'goto'])

const next = ()     => emit('next')
const prev = ()     => emit('prev')
const skip = ()     => emit('skip')
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.tutorial-header-label {
  position: absolute;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.6);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.tutorial-dots {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}
.dot.active {
  background: #60a5fa;
  width: 24px;
  border-radius: 4px;
}

.tutorial-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem 2.25rem 2rem;
  max-width: 420px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  color: #64748b;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.close-btn:hover { background: #e2e8f0; }

.step-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  line-height: 1;
}

.step-progress {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.step-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 0.85rem;
  line-height: 1.3;
}

.step-text {
  font-size: 0.92rem;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 1.75rem;
}

.step-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-next {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-next:hover { background: #1d4ed8; transform: translateY(-1px); }

.btn-prev {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.2rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-prev:hover { background: #e2e8f0; }

.skip-link {
  display: block;
  margin-top: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.15s;
}
.skip-link:hover { color: #64748b; }

/* Transitions */
.tutorial-fade-enter-active,
.tutorial-fade-leave-active { transition: opacity 0.25s ease; }
.tutorial-fade-enter-from,
.tutorial-fade-leave-to { opacity: 0; }

.step-slide-enter-active,
.step-slide-leave-active { transition: all 0.2s ease; }
.step-slide-enter-from { opacity: 0; transform: translateX(20px); }
.step-slide-leave-to  { opacity: 0; transform: translateX(-20px); }

@media (max-width: 480px) {
  .tutorial-card { padding: 2rem 1.5rem 1.75rem; }
  .step-title { font-size: 1.1rem; }
}
</style>
