<template>
  <div class="image-uploader">
    <!-- Si pas d'image, afficher la zone d'upload -->
    <div v-if="!imageUrl" class="upload-area" @click="openWidget">
      <div class="upload-icon">📷</div>
      <p>Cliquez pour ajouter une image</p>
      <p class="hint">JPG, PNG - Max 5 Mo</p>
    </div>
    
    <!-- Si une image est sélectionnée, afficher la prévisualisation -->
    <div v-else class="preview-area">
      <img :src="imageUrl" alt="Aperçu" class="preview-image">
      <button type="button" class="remove-btn" @click="removeImage" title="Supprimer">
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// On reçoit la valeur du parent (v-model)
const props = defineProps({
  modelValue: String
});

// On émet les changements vers le parent
const emit = defineEmits(['update:modelValue']);

// URL de l'image (réactive)
const imageUrl = ref(props.modelValue || '');

// CONFIGURATION CLOUDINARY - À MODIFIER !
const CLOUD_NAME = 'delbtkoa4';  // Remplacez par votre cloud name
const UPLOAD_PRESET = 'upm-events-preset';  // À créer dans Cloudinary

// Fonction pour ouvrir le widget d'upload
const openWidget = () => {
  if (!window.cloudinary) {
    alert("Erreur: Le script Cloudinary n'est pas chargé");
    return;
  }

  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      sources: ['local', 'url'],
      multiple: false,
      maxFileSize: 5000000,
      resourceType: 'image',
      folder: 'upm-events'
    },
    (error, result) => {
      if (!error && result && result.event === 'success') {
        imageUrl.value = result.info.secure_url;
        emit('update:modelValue', imageUrl.value);
        console.log('Image uploadée:', imageUrl.value);
      }
    }
  );
  widget.open();
};

// Fonction pour supprimer l'image
const removeImage = () => {
  imageUrl.value = '';
  emit('update:modelValue', '');
};

// Si le parent change la valeur, on met à jour
watch(() => props.modelValue, (newVal) => {
  imageUrl.value = newVal || '';
});
</script>

<style scoped>
.image-uploader {
  width: 100%;
  margin: 15px 0;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f9f9f9;
}

.upload-area:hover {
  border-color: #42b983;
  background: #f0f0f0;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-area p {
  margin: 5px 0;
  color: #666;
}

.hint {
  font-size: 0.8em;
  color: #999;
}

.preview-area {
  position: relative;
  display: inline-block;
  width: 100%;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.remove-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.remove-btn:hover {
  background: #cc0000;
}
</style>