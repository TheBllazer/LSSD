import React, { useState } from 'react';
import { Link2, X, ImageOff } from 'lucide-react';
import './ImageUploader.css';

// Pas d'upload : l'agent héberge lui-même la photo sur postimages.org
// (ou un service équivalent) et colle ici le lien direct de l'image.
// L'app se contente d'afficher l'URL fournie — rien n'est envoyé ni stocké
// ailleurs que ce texte dans Firestore.
function ImageUploader({ onImageUrlReceived, currentImageUrl = null }) {
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState(null);
  const [brokenImage, setBrokenImage] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      setError('Le lien doit commencer par http:// ou https://');
      return;
    }

    setError(null);
    setBrokenImage(false);
    onImageUrlReceived(url);
    setInputUrl('');
  };

  const handleRemoveImage = () => {
    onImageUrlReceived(null);
    setBrokenImage(false);
  };

  return (
    <div className="image-uploader">
      {currentImageUrl ? (
        <div className="image-preview">
          {brokenImage ? (
            <div className="image-broken">
              <ImageOff size={28} />
              <span>Impossible de charger cette image. Vérifie que c'est bien le lien direct.</span>
            </div>
          ) : (
            <img
              src={currentImageUrl}
              alt="Preview"
              onError={() => setBrokenImage(true)}
            />
          )}
          <button
            className="remove-image-btn"
            onClick={handleRemoveImage}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="url-input-area">
          <div className="url-input-row">
            <Link2 size={18} />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Colle ici le lien direct de l'image (postimages.org...)"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(e); }}
            />
            <button type="button" className="btn-secondary" onClick={handleAdd}>
              Ajouter
            </button>
          </div>
          <p className="url-hint">
            Sur postimages.org, héberge ta photo puis copie le lien <strong>« Direct link »</strong> (celui qui se termine par .jpg/.png), pas le lien de la page.
          </p>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ImageUploader;
