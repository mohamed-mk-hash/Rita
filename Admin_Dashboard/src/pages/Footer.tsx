import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';
interface LocalizedText {
  en: string;
  fr: string;
}

interface FooterLink {
  label: LocalizedText;
  href: string;
}

interface FooterContent {
  title: LocalizedText;
  cta: LocalizedText;
  ctaHref: string;
  sitemapTitle: LocalizedText;
  socialsTitle: LocalizedText;
  sitemap: FooterLink[];
  socials: FooterLink[];
  logoUrl: string;
  copyright: LocalizedText;
  year: string;
}

const defaultFooterContent: FooterContent = {
  title: {
    en: 'Let’s work together today!',
    fr: 'Travaillons ensemble dès aujourd’hui !',
  },
  cta: {
    en: 'Start project',
    fr: 'Démarrer un projet',
  },
  ctaHref: 'mailto:aminemokhtari028@gmail.com',
  sitemapTitle: {
    en: 'Sitemap',
    fr: 'Plan du site',
  },
  socialsTitle: {
    en: 'Socials',
    fr: 'Réseaux sociaux',
  },
  sitemap: [
    {
      label: { en: 'Home', fr: 'Accueil' },
      href: '#home',
    },
    {
      label: { en: 'About', fr: 'À propos' },
      href: '#about',
    },
    {
      label: { en: 'Work', fr: 'Projets' },
      href: '#work',
    },
    {
      label: { en: 'Contact', fr: 'Contact' },
      href: '#contact',
    },
  ],
  socials: [
    {
      label: { en: 'GitHub', fr: 'GitHub' },
      href: 'https://github.com/mohamed-mk-hash',
    },
    {
      label: { en: 'LinkedIn', fr: 'LinkedIn' },
      href: 'https://www.linkedin.com/in/mokhtarimohamedlamine/',
    },
    {
      label: { en: 'Facebook', fr: 'Facebook' },
      href: 'https://www.facebook.com/profile.php?id=61582311654362',
    },
  ],
  logoUrl: '/images/logo.svg',
  copyright: {
    en: 'All rights reserved.',
    fr: 'Tous droits réservés.',
  },
  year: '2025',
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const Footer: React.FC = () => {
  const { isArabic } = useLanguage();
  const isFrench = isArabic;

  const [form, setForm] = useState<FooterContent>(defaultFooterContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchFooter = async () => {
  setLoading(true);
  setError('');

  try {
    const response = await fetch(
      `${API_URL}/admin/content/footer`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    /*
     * في حال لم تتم إضافة بيانات Footer بعد،
     * نعرض البيانات الافتراضية.
     */
    if (response.status === 404) {
      setForm(defaultFooterContent);
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Could not load footer'
      );
    }

    const footerData =
      data.footer || data.content || data;

    setForm({
      ...defaultFooterContent,
      ...footerData,
    });
  } catch (err) {
    console.error('FETCH_FOOTER_ERROR:', err);

    setError(
      isFrench
        ? 'Erreur lors du chargement'
        : err instanceof Error
          ? err.message
          : 'Error loading footer'
    );

    /*
     * نعرض البيانات الافتراضية حتى لا تبقى الصفحة فارغة.
     */
    setForm(defaultFooterContent);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchFooter();
  }, []);

  const updateLocalized = (
    field: keyof FooterContent,
    lang: 'en' | 'fr',
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] as LocalizedText),
        [lang]: value,
      },
    }));
  };

  const updateField = (field: keyof FooterContent, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateLink = (
    section: 'sitemap' | 'socials',
    index: number,
    field: 'href',
    value: string
  ) => {
    setForm((prev) => {
      const copy = clone(prev);
      copy[section][index][field] = value;
      return copy;
    });
  };

  const updateLinkLabel = (
    section: 'sitemap' | 'socials',
    index: number,
    lang: 'en' | 'fr',
    value: string
  ) => {
    setForm((prev) => {
      const copy = clone(prev);
      copy[section][index].label[lang] = value;
      return copy;
    });
  };

  const addLink = (section: 'sitemap' | 'socials') => {
    setForm((prev) => ({
      ...prev,
      [section]: [
        ...prev[section],
        {
          label: { en: '', fr: '' },
          href: '',
        },
      ],
    }));
  };

  const removeLink = (section: 'sitemap' | 'socials', index: number) => {
    setForm((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const uploadLogoToCloudinary = async (file: File): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Missing Cloudinary environment variables');
  }

  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only PNG, JPG, WEBP, and SVG files are allowed');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }

  return data.secure_url;
};

const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setMessage('');
  setError('');

  try {
    setUploadingLogo(true);

    const logoUrl = await uploadLogoToCloudinary(file);

    setForm((prev) => ({
      ...prev,
      logoUrl,
    }));

    setMessage(
      isFrench
        ? 'Logo téléversé avec succès'
        : 'Logo uploaded successfully'
    );
  } catch (err) {
    console.error(err);
    setError(
      isFrench
        ? 'Erreur lors du téléversement du logo'
        : 'Error uploading logo'
    );
  } finally {
    setUploadingLogo(false);
    e.target.value = '';
  }
};

 const saveFooter = async () => {
  setMessage('');
  setError('');
  setSaving(true);

  try {
    const response = await fetch(
      `${API_URL}/admin/content/footer`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      }
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || 'Could not save footer'
      );
    }

    if (data.footer) {
      setForm({
        ...defaultFooterContent,
        ...data.footer,
      });
    }

    setMessage(
      isFrench
        ? 'Footer enregistré avec succès'
        : 'Footer saved successfully'
    );
  } catch (err) {
    console.error('SAVE_FOOTER_ERROR:', err);

    setError(
      isFrench
        ? 'Erreur lors de l’enregistrement'
        : err instanceof Error
          ? err.message
          : 'Error saving footer'
    );
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Footer</h1>
        <Card>
          <p>{isFrench ? 'Chargement...' : 'Loading...'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {isFrench ? 'Modifier le Footer' : 'Edit Footer'}
      </h1>

      <Card>
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Section title={isFrench ? 'Texte principal' : 'Main Text'}>
          <TwoColumn>
            <LocalizedInput
              label={isFrench ? 'Titre' : 'Title'}
              value={form.title}
              onChange={(lang, value) => updateLocalized('title', lang, value)}
            />

            <LocalizedInput
              label={isFrench ? 'Texte du bouton' : 'Button Text'}
              value={form.cta}
              onChange={(lang, value) => updateLocalized('cta', lang, value)}
            />

            <Input
              label={isFrench ? 'Lien du bouton' : 'Button Link'}
              value={form.ctaHref}
              onChange={(value) => updateField('ctaHref', value)}
            />

            <Input
              label={isFrench ? 'Année' : 'Year'}
              value={form.year}
              onChange={(value) => updateField('year', value)}
            />

            <LocalizedInput
              label="Copyright"
              value={form.copyright}
              onChange={(lang, value) => updateLocalized('copyright', lang, value)}
            />

            <div className="rounded-lg border border-gray-200 bg-white p-4">
  <h4 className="mb-3 text-sm font-semibold text-gray-900">
    {isFrench ? 'Logo' : 'Logo'}
  </h4>

  <div className="space-y-3">
    <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-gray-50">
      {form.logoUrl ? (
        <img
          src={form.logoUrl}
          alt="Footer logo"
          className="max-h-16 max-w-16 object-contain"
        />
      ) : (
        <span className="text-xs text-gray-400">
          {isFrench ? 'Aucun logo' : 'No logo'}
        </span>
      )}
    </div>

    <input
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.svg"
      onChange={handleLogoUpload}
      disabled={uploadingLogo}
      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700 disabled:opacity-60"
    />

    <Input
      label="Cloudinary Logo URL"
      value={form.logoUrl}
      onChange={(value) => updateField('logoUrl', value)}
    />

    {uploadingLogo && (
      <p className="text-sm text-blue-600">
        {isFrench ? 'Téléversement...' : 'Uploading...'}
      </p>
    )}

    <p className="text-xs text-gray-500">
      PNG, JPG, WEBP, SVG
    </p>
  </div>
</div>
          </TwoColumn>
        </Section>

        <Section title={isFrench ? 'Sitemap' : 'Sitemap'}>
          <LocalizedInput
            label={isFrench ? 'Titre Sitemap' : 'Sitemap Title'}
            value={form.sitemapTitle}
            onChange={(lang, value) => updateLocalized('sitemapTitle', lang, value)}
          />

          <div className="space-y-4">
            {form.sitemap.map((link, index) => (
              <ItemBox
                key={index}
                title={link.label.en || `Sitemap link ${index + 1}`}
                removeLabel={isFrench ? 'Supprimer' : 'Delete'}
                onRemove={() => removeLink('sitemap', index)}
              >
                <TwoColumn>
                  <LocalizedInput
                    label={isFrench ? 'Label' : 'Label'}
                    value={link.label}
                    onChange={(lang, value) =>
                      updateLinkLabel('sitemap', index, lang, value)
                    }
                  />

                  <Input
                    label="Href"
                    value={link.href}
                    onChange={(value) => updateLink('sitemap', index, 'href', value)}
                  />
                </TwoColumn>
              </ItemBox>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addLink('sitemap')}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-800"
          >
            {isFrench ? 'Ajouter un lien Sitemap' : 'Add Sitemap Link'}
          </button>
        </Section>

        <Section title={isFrench ? 'Réseaux sociaux' : 'Social Links'}>
          <LocalizedInput
            label={isFrench ? 'Titre réseaux sociaux' : 'Socials Title'}
            value={form.socialsTitle}
            onChange={(lang, value) => updateLocalized('socialsTitle', lang, value)}
          />

          <div className="space-y-4">
            {form.socials.map((link, index) => (
              <ItemBox
                key={index}
                title={link.label.en || `Social link ${index + 1}`}
                removeLabel={isFrench ? 'Supprimer' : 'Delete'}
                onRemove={() => removeLink('socials', index)}
              >
                <TwoColumn>
                  <LocalizedInput
                    label={isFrench ? 'Label' : 'Label'}
                    value={link.label}
                    onChange={(lang, value) =>
                      updateLinkLabel('socials', index, lang, value)
                    }
                  />

                  <Input
                    label="URL"
                    value={link.href}
                    onChange={(value) => updateLink('socials', index, 'href', value)}
                  />
                </TwoColumn>
              </ItemBox>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addLink('socials')}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-800"
          >
            {isFrench ? 'Ajouter un réseau social' : 'Add Social Link'}
          </button>
        </Section>

        <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-white px-6 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={saveFooter}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {saving
              ? isFrench
                ? 'Enregistrement...'
                : 'Saving...'
              : isFrench
              ? 'Enregistrer'
              : 'Save Changes'}
          </button>
        </div>
      </Card>
    </div>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <section className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="space-y-6">{children}</div>
    </section>
  );
};

interface ItemBoxProps {
  title: string;
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
}

const ItemBox: React.FC<ItemBoxProps> = ({
  title,
  children,
  onRemove,
  removeLabel,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
        >
          {removeLabel}
        </button>
      </div>

      {children}
    </div>
  );
};

interface TwoColumnProps {
  children: React.ReactNode;
}

const TwoColumn: React.FC<TwoColumnProps> = ({ children }) => {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>;
};

interface LocalizedInputProps {
  label: string;
  value: LocalizedText;
  onChange: (language: 'en' | 'fr', value: string) => void;
}

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-900">{label}</h4>

      <div className="space-y-3">
        <Input
          label="English"
          value={value.en}
          onChange={(newValue) => onChange('en', newValue)}
        />

        <Input
          label="Français"
          value={value.fr}
          onChange={(newValue) => onChange('fr', newValue)}
        />
      </div>
    </div>
  );
};

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const Input: React.FC<InputProps> = ({ label, value, onChange }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};