'use client';

import InfoPageShell from '@/components/InfoPageShell';

export default function CguPage() {
  return (
    <InfoPageShell title="Conditions Générales d'Utilisation">
      <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme
        <strong> Oosira</strong> (accessible à l&apos;adresse <a href="https://oosira.com">oosira.com</a>), un service de création
        de CV professionnels en ligne.
      </p>

      <h2>2. Acceptation des conditions</h2>
      <p>
        L&apos;utilisation de la plateforme implique l&apos;acceptation pleine et entière des présentes CGU.
        Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
      </p>

      <h2>3. Description du service</h2>
      <p>Oosira offre les fonctionnalités suivantes :</p>
      <ul>
        <li>Création de CV professionnels via un éditeur en ligne.</li>
        <li>Prévisualisation en temps réel.</li>
        <li>Export en PDF haute qualité.</li>
        <li>Choix parmi plusieurs modèles élégants.</li>
        <li>Importation de données par OCR (reconnaissance optique).</li>
        <li>Sauvegarde et gestion de plusieurs CV via un compte utilisateur.</li>
      </ul>

      <h2>4. Inscription et compte utilisateur</h2>
      <p>
        Certaines fonctionnalités nécessitent la création d&apos;un compte. L&apos;utilisateur s&apos;engage à fournir des
        informations exactes et à maintenir la confidentialité de ses identifiants. Toute utilisation
        du compte sous ses identifiants est réputée effectuée par l&apos;utilisateur lui-même.
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        Le contenu des CV créés reste la propriété de l&apos;utilisateur. Les modèles, le design, le code source
        et les éléments graphiques de la plateforme sont la propriété exclusive d&apos;Oosira et sont protégés par
        les lois relatives à la propriété intellectuelle.
      </p>

      <h2>6. Comportement de l&apos;utilisateur</h2>
      <p>L&apos;utilisateur s&apos;engage à :</p>
      <ul>
        <li>Ne pas utiliser la plateforme à des fins illicites ou frauduleuses.</li>
        <li>Ne pas tenter de compromettre la sécurité ou le fonctionnement du service.</li>
        <li>Ne pas créer de contenu diffamatoire, discriminatoire ou contraire à l&apos;ordre public.</li>
        <li>Respecter les droits des tiers dans le contenu de ses CV.</li>
      </ul>

      <h2>7. Disponibilité du service</h2>
      <p>
        Oosira s&apos;efforce d&apos;assurer la disponibilité continue de la plateforme mais ne garantit pas un accès
        ininterrompu. Des interruptions pour maintenance ou mise à jour pourront survenir sans préavis.
      </p>

      <h2>8. Limitation de responsabilité</h2>
      <p>
        Oosira ne pourra être tenue responsable des dommages directs ou indirects résultant de l&apos;utilisation
        ou de l&apos;impossibilité d&apos;utiliser la plateforme, ni de la perte de données. L&apos;utilisateur est responsable
        de la sauvegarde de ses propres données.
      </p>

      <h2>9. Modification des CGU</h2>
      <p>
        Oosira se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
        informés des modifications par tout moyen approprié. La poursuite de l&apos;utilisation du service
        vaut acceptation des nouvelles conditions.
      </p>

      <h2>10. Loi applicable et juridiction</h2>
      <p>
        Les présentes CGU sont régies par le droit algérien. Tout litige sera soumis aux juridictions
        compétentes du ressort du siège social d&apos;Oosira.
      </p>

      <h2>11. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU, contactez-nous à :
        <br /><a href="mailto:contact@oosira.com">contact@oosira.com</a>
      </p>
    </InfoPageShell>
  );
}
