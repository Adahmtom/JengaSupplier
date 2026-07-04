'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'fr' | 'en'

const translations = {
  fr: {
    // Nav
    signIn:  'Se connecter',
    join:    'Commencer',
    myVault: 'Mon Vault',

    // Sidebar
    dailyFeed:    'Fil des fournisseurs',
    scamAlerts:   'Vidéos Entrepôts',
    portals:      'Catégories',
    main:         'Principal',
    myAccount:    'Mon compte',

    // Feed
    feedTitle:    'Fil des Fournisseurs',
    feedSearch:   'Rechercher un fournisseur, produit, catégorie…',
    feedAll:      '✦ Tous',
    feedNew:      'nouveaux aujourd\'hui',
    feedSuppliers:'fournisseurs',
    feedResults:  'résultat',
    feedResults_p:'résultats',
    feedFor:      'pour',
    feedIn:       'dans',
    feedNoDrops:  'Aucun fournisseur pour l\'instant. Revenez bientôt.',
    feedNoResults:'Aucun résultat pour cette recherche.',
    feedReset:    'Réinitialiser les filtres',
    feedNewBadge: 'nouveaux',

    // Account
    myAccountTitle:    'Mon Compte',
    profile:           'Profil',
    memberSince:       'Membre depuis',
    subscription:      'Abonnement',
    active:            'Actif',
    subscribeNow:      'S\'abonner — $29/mois',
    noSubscription:    'Aucun abonnement actif.',
    planName:          'Jenga Supplier Vault™',
    statusLabel:       'Statut',
    renewsOn:          'Renouvellement le',
    cancelsOn:         'Se termine le',
    statusActive:      'Actif',
    statusTrialing:    'Période d\'essai',
    statusCanceled:    'Annulé',
    cancelWarning:     'Votre abonnement sera annulé le',
    cancelWarningEnd:  '. Réactivez pour conserver l\'accès.',
    manageBilling:     'Gérer la facturation',
    whatsIncluded:     'Ce qui est inclus',
    help:              'Aide & Support',
    contactSupport:    'Contacter le support',
    monthlyLives:      'Lives mensuels',
    monthlyLivesSub:   'Sessions en direct avec Belle Jones — consultez le feed pour les dates',
    startingGuide:     'Guide de démarrage',
    startingGuideSub:  'Commencez par le portail "General" pour les bases',
    signOut:           'Se déconnecter',

    // Access features
    access: [
      '500+ fournisseurs vérifiés',
      'Nouveaux drops hebdomadaires',
      "Vidéos d'usines",
      'Alertes arnaques',
      "Guides d'importation",
      'Templates multilingues',
      'Calculateur de coûts',
      'Transitaires recommandés',
      'Lives avec Belle Jones',
      'Accès illimité au contenu',
    ],

    // Role badges
    roleSuperAdmin: '⚡ Super Admin',
    roleAdmin:      '🛡 Admin',
    roleModerator:  '🔧 Modérateur',
    roleMember:     '✦ Membre',
  },

  en: {
    // Nav
    signIn:  'Sign in',
    join:    'Get started',
    myVault: 'My Vault',

    // Sidebar
    dailyFeed:    'Supplier Feed',
    scamAlerts:   'Warehouse Videos',
    portals:      'Categories',
    main:         'Main',
    myAccount:    'My Account',

    // Feed
    feedTitle:    'Supplier Feed',
    feedSearch:   'Search suppliers, products, categories…',
    feedAll:      '✦ All',
    feedNew:      'new today',
    feedSuppliers:'suppliers',
    feedResults:  'result',
    feedResults_p:'results',
    feedFor:      'for',
    feedIn:       'in',
    feedNoDrops:  'No vendors yet. Check back soon.',
    feedNoResults:'No results for this search.',
    feedReset:    'Clear filters',
    feedNewBadge: 'new',

    // Account
    myAccountTitle:    'My Account',
    profile:           'Profile',
    memberSince:       'Member since',
    subscription:      'Subscription',
    active:            'Active',
    subscribeNow:      'Subscribe — $29/month',
    noSubscription:    'No active subscription.',
    planName:          'Jenga Supplier Vault™',
    statusLabel:       'Status',
    renewsOn:          'Renews on',
    cancelsOn:         'Cancels on',
    statusActive:      'Active',
    statusTrialing:    'Trial period',
    statusCanceled:    'Canceled',
    cancelWarning:     'Your subscription will cancel on',
    cancelWarningEnd:  '. Reactivate to keep access.',
    manageBilling:     'Manage billing',
    whatsIncluded:     "What's included",
    help:              'Help & Support',
    contactSupport:    'Contact support',
    monthlyLives:      'Monthly live sessions',
    monthlyLivesSub:   'Live sessions with Belle Jones — check the feed for dates',
    startingGuide:     'Getting started guide',
    startingGuideSub:  'Start with the "General" portal for the basics',
    signOut:           'Sign out',

    // Access features
    access: [
      '500+ verified suppliers',
      'New weekly drops',
      'Factory videos',
      'Scam alerts',
      'Import guides',
      'Multilingual templates',
      'Cost calculator',
      'Recommended freight forwarders',
      'Live sessions with Belle Jones',
      'Unlimited content access',
    ],

    // Role badges
    roleSuperAdmin: '⚡ Super Admin',
    roleAdmin:      '🛡 Admin',
    roleModerator:  '🔧 Moderator',
    roleMember:     '✦ Member',
  },
} as const

type Translations = typeof translations['fr'] | typeof translations['en']

interface LangContextValue {
  lang: Lang
  t: Translations
  toggle: () => void
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')

  useEffect(() => {
    const stored = localStorage.getItem('vault-lang') as Lang | null
    if (stored === 'fr' || stored === 'en') setLang(stored)
  }, [])

  function toggle() {
    setLang((prev) => {
      const next = prev === 'fr' ? 'en' : 'fr'
      localStorage.setItem('vault-lang', next)
      return next
    })
  }

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
