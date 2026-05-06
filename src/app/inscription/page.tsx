'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FormData {
  // Couche 1 - Identité
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;

  // Couche 2 - Orientation
  educationLevel: string;
  specialty: string;
  projectStatus: string;
  projectDescription: string;
  interests: string[];

  // Couche 3 - Événement
  howYouHeard: string;
  comment: string;
}

type StepType = 1 | 2 | 3 | 4;

export default function InscriptionPage() {
  const [step, setStep] = useState<StepType>(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    city: '',
    educationLevel: '',
    specialty: '',
    projectStatus: '',
    projectDescription: '',
    interests: [],
    howYouHeard: '',
    comment: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        interests: checked ? [...prev.interests, value] : prev.interests.filter((i) => i !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }));
  };

  const isStep1Valid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.birthDate &&
      formData.city.trim()
    );
  };

  const isStep2Valid = () => {
    const hasRequiredFields =
      formData.educationLevel &&
      formData.projectStatus &&
      formData.interests.length > 0;

    if (formData.projectStatus === 'J\'ai un projet défini') {
      return hasRequiredFields && formData.projectDescription.trim();
    }

    return hasRequiredFields;
  };

  const isStep3Valid = () => {
    return formData.howYouHeard.trim();
  };

  const handleNextStep = () => {
    if (step === 1 && isStep1Valid()) {
      setStep(2);
    } else if (step === 2 && isStep2Valid()) {
      setStep(3);
    } else if (step === 3 && isStep3Valid()) {
      setStep(4);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1 && step < 4) {
      setStep((step - 1) as StepType);
    }
  };

  const getProgressPercentage = () => {
    if (step === 1) return 33;
    if (step === 2) return 66;
    if (step === 3) return 100;
    return 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo-pilotes.png"
                alt="Les Pilotes"
                fill
                className="object-contain"
              />
            </div>
            <div className="text-xs text-zinc-600">
              <div className="font-semibold text-zinc-900">Workshop 100% Féminin</div>
              <div>La Cité Audacieuse · 18 avril 2026 · 9h30–12h30</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {step < 4 && (
          <div className="bg-zinc-100">
            <div className="max-w-2xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-700">Étape {step}/3</span>
                <span className="text-sm text-zinc-600">{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {step === 1 && <Step1 formData={formData} handleInputChange={handleInputChange} />}
        {step === 2 && <Step2 formData={formData} handleInputChange={handleInputChange} handleCheckboxChange={handleCheckboxChange} />}
        {step === 3 && (
          <Step3
            formData={formData}
            handleInputChange={handleInputChange}
            onPreviousStep={handlePreviousStep}
          />
        )}
        {step === 4 && <SuccessScreen firstName={formData.firstName} />}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="mt-12 flex gap-3 items-center">
            {step > 1 && (
              <button
                onClick={handlePreviousStep}
                className="flex-1 px-6 py-3 border-2 border-zinc-300 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Retour
              </button>
            )}
            <button
              onClick={handleNextStep}
              disabled={
                (step === 1 && !isStep1Valid()) ||
                (step === 2 && !isStep2Valid()) ||
                (step === 3 && !isStep3Valid())
              }
              className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors ${
                (step === 1 && !isStep1Valid()) ||
                (step === 2 && !isStep2Valid()) ||
                (step === 3 && !isStep3Valid())
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {step === 3 ? 'Valider mon inscription' : 'Continuer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface Step1Props {
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

function Step1({ formData, handleInputChange }: Step1Props) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Qui es-tu?</h1>
        <p className="text-lg text-zinc-600">Commençons par les bases</p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Prénom*"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Alice"
          />
          <FormField
            label="Nom*"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Dupont"
          />
        </div>

        <FormField
          label="Email*"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="alice@example.com"
        />

        <FormField
          label="Téléphone*"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+33 6 12 34 56 78"
        />

        <FormField
          label="Date de naissance*"
          name="birthDate"
          type="date"
          value={formData.birthDate}
          onChange={handleInputChange}
        />

        <FormField
          label="Ville de résidence*"
          name="city"
          type="text"
          value={formData.city}
          onChange={handleInputChange}
          placeholder="Paris"
        />
      </div>
    </div>
  );
}

interface Step2Props {
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCheckboxChange: (value: string) => void;
}

function Step2({ formData, handleInputChange, handleCheckboxChange }: Step2Props) {
  const interests = [
    'Tech & Numérique',
    'Finance & Banque',
    'Marketing & Communication',
    'Santé & Médecine',
    'Droit & Justice',
    'Art & Culture',
    'Éducation & Social',
    'Autre',
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Tes orientations</h1>
        <p className="text-lg text-zinc-600">Parlons de ton parcours et tes ambitions</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-900 mb-3">
            Niveau scolaire*
          </label>
          <select
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
          >
            <option value="">Sélectionne ton niveau</option>
            <option value="3ème">3ème</option>
            <option value="Seconde">Seconde</option>
            <option value="Première">Première</option>
            <option value="Terminale">Terminale</option>
            <option value="BTS/BUT">BTS/BUT</option>
            <option value="Licence">Licence</option>
            <option value="Master">Master</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <FormField
          label="Filière / Spécialité"
          name="specialty"
          type="text"
          value={formData.specialty}
          onChange={handleInputChange}
          placeholder="Ex: Scientifique, Économique..."
          required={false}
        />

        <div>
          <label className="block text-sm font-semibold text-zinc-900 mb-4">
            Ton projet professionnel*
          </label>
          <div className="space-y-3">
            {['J\'ai un projet défini', 'Mon projet est en construction', 'Je n\'ai pas encore de projet'].map(
              (option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="projectStatus"
                    value={option}
                    checked={formData.projectStatus === option}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-orange-500 border-2 border-zinc-300 focus:ring-2 focus:ring-orange-100"
                  />
                  <span className="text-zinc-700">{option}</span>
                </label>
              )
            )}
          </div>
        </div>

        {formData.projectStatus === 'J\'ai un projet défini' && (
          <FormField
            label="Décris ton projet*"
            name="projectDescription"
            type="textarea"
            value={formData.projectDescription}
            onChange={handleInputChange}
            placeholder="Partage tes ambitions..."
            rows={4}
          />
        )}

        <div>
          <label className="block text-sm font-semibold text-zinc-900 mb-4">
            Domaines d'intérêt*
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {interests.map((interest) => (
              <label key={interest} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={() => handleCheckboxChange(interest)}
                  className="w-5 h-5 text-orange-500 border-2 border-zinc-300 rounded focus:ring-2 focus:ring-orange-100"
                />
                <span className="text-zinc-700">{interest}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Step3Props {
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onPreviousStep: () => void;
}

function Step3({ formData, handleInputChange, onPreviousStep }: Step3Props) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Dernières informations</h1>
        <p className="text-lg text-zinc-600">Et un récapitulatif</p>
      </div>

      <div className="space-y-8">
        {/* Question */}
        <div>
          <label className="block text-sm font-semibold text-zinc-900 mb-3">
            Comment as-tu entendu parler de cet événement?*
          </label>
          <select
            name="howYouHeard"
            value={formData.howYouHeard}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
          >
            <option value="">Sélectionne une option</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Bouche à oreille">Bouche à oreille</option>
            <option value="Via un référent/professeur">Via un référent/professeur</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-900 mb-3">
            Commentaire / Question
          </label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="As-tu des questions? Des besoins spécifiques?"
            rows={4}
            className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors resize-none"
          />
        </div>

        {/* Récapitulatif */}
        <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-lg p-6 border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Récapitulatif</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Prénom & Nom</span>
              <span className="font-medium text-zinc-900">
                {formData.firstName} {formData.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Email</span>
              <span className="font-medium text-zinc-900">{formData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Téléphone</span>
              <span className="font-medium text-zinc-900">{formData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Ville</span>
              <span className="font-medium text-zinc-900">{formData.city}</span>
            </div>

            <div className="border-t border-zinc-300 pt-3 mt-3" />

            <div className="flex justify-between">
              <span className="text-zinc-600">Niveau scolaire</span>
              <span className="font-medium text-zinc-900">{formData.educationLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Projet</span>
              <span className="font-medium text-zinc-900">{formData.projectStatus}</span>
            </div>
            <div className="flex justify-start gap-2 flex-wrap">
              <span className="text-zinc-600">Intérêts:</span>
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest) => (
                  <span key={interest} className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-300 pt-3 mt-3" />

            <div className="flex justify-between">
              <span className="text-zinc-600">Source</span>
              <span className="font-medium text-zinc-900">{formData.howYouHeard}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ✓ En validant, tu confirmes avoir lu et accepté notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
}

interface SuccessScreenProps {
  firstName: string;
}

function SuccessScreen({ firstName }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-6">✨</div>

      <h1 className="text-4xl font-bold text-zinc-900 mb-3 text-center">Félicitations {firstName}!</h1>

      <p className="text-xl text-zinc-600 text-center mb-8 max-w-md">
        Ton inscription au Workshop 100% Féminin a été confirmée.
      </p>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-8 border border-orange-200 max-w-md text-center mb-8">
        <div className="text-sm text-zinc-600 mb-2">Tes informations ont été envoyées à</div>
        <div className="font-semibold text-zinc-900 text-lg">amadou@les-pilotes.fr</div>
      </div>

      <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200 max-w-md space-y-4 text-center mb-8">
        <div className="font-semibold text-zinc-900">Ce qui t'attend:</div>
        <ul className="space-y-2 text-sm text-zinc-700">
          <li>📧 Un email de confirmation avec tous les détails</li>
          <li>📍 La Cité Audacieuse, 18 avril 2026</li>
          <li>⏰ 9h30 – 12h30</li>
          <li>👩‍💼 À bientôt pour découvrir tes ambitions!</li>
        </ul>
      </div>

      <p className="text-sm text-zinc-500 text-center">
        Tu recevras bientôt un email de confirmation avec les détails pratiques.
      </p>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

function FormField({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required = true,
  rows = 1,
}: FormFieldProps) {
  const baseClasses =
    'w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors';

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-900 mb-2">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`${baseClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
}
