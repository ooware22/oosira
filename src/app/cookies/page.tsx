'use client';

import InfoPageShell from '@/components/InfoPageShell';

export default function CookiesPage() {
  return (
    <InfoPageShell title="Politique cookies">
      <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette) lors
        de votre visite sur notre plateforme. Il permet de stocker des informations relatives à votre navigation
        afin d&apos;améliorer votre expérience utilisateur.
      </p>

      <h2>2. Cookies utilisés par Oosira</h2>

      <h3>2.1 Cookies strictement nécessaires</h3>
      <p>
        Ces cookies sont indispensables au fonctionnement de la plateforme et ne peuvent pas être désactivés.
        Ils comprennent notamment :
      </p>
      <ul>
        <li><strong>Cookie de session</strong> : maintien de votre connexion à votre compte.</li>
        <li><strong>Cookie de préférence de langue</strong> : mémorisation de votre choix linguistique (FR/AR).</li>
        <li><strong>Cookie de thème</strong> : mémorisation de votre préférence de thème (clair/sombre).</li>
      </ul>

      <h3>2.2 Cookies de performance</h3>
      <p>
        Ces cookies nous permettent de comprendre comment les visiteurs interagissent avec la plateforme,
        afin d&apos;en améliorer le fonctionnement et les performances.
      </p>

      <h3>2.3 Cookies tiers</h3>
      <p>
        Cloudflare peut déposer des cookies techniques pour la sécurité et la performance du réseau de
        diffusion de contenu (CDN). Ces cookies ne sont pas utilisés à des fins publicitaires.
      </p>

      <h2>3. Gestion de vos préférences</h2>
      <p>
        Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres
        de votre navigateur :
      </p>
      <ul>
        <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
        <li><strong>Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies</li>
        <li><strong>Safari :</strong> Préférences → Confidentialité → Cookies</li>
        <li><strong>Edge :</strong> Paramètres → Cookies et autorisations de site</li>
      </ul>
      <p>
        <strong>Note :</strong> La désactivation de certains cookies peut affecter le fonctionnement
        de la plateforme et limiter l&apos;accès à certaines fonctionnalités.
      </p>

      <h2>4. Durée de conservation</h2>
      <p>
        Les cookies de session sont supprimés à la fermeture de votre navigateur. Les cookies persistants
        ont une durée de vie maximale de <strong>12 mois</strong>.
      </p>

      <h2>5. Contact</h2>
      <p>
        Pour toute question relative à notre utilisation des cookies :
        <br /><a href="mailto:contact@oosira.com">contact@oosira.com</a>
      </p>
    </InfoPageShell>
  );
}
