'use client';

import InfoPageShell from '@/components/InfoPageShell';

export default function MentionsLegalesPage() {
  return (
    <InfoPageShell title="Mentions légales">
      <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <h2>1. Éditeur du site</h2>
      <ul>
        <li><strong>Nom de la plateforme :</strong> Oosira</li>
        <li><strong>URL :</strong> <a href="https://oosira.com">https://oosira.com</a></li>
        <li><strong>E-mail de contact :</strong> <a href="mailto:contact@oosira.com">contact@oosira.com</a></li>
        <li><strong>Pays :</strong> Algérie</li>
      </ul>

      <h2>2. Hébergeur</h2>
      <ul>
        <li><strong>CDN / Proxy :</strong> Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, USA</li>
        <li><strong>Infrastructure serveur :</strong> Hetzner Online GmbH — Industriestr. 25, 91710 Gunzenhausen, Allemagne</li>
      </ul>

      <h2>3. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est le représentant légal de la société éditrice d&apos;Oosira.
        Contact : <a href="mailto:contact@oosira.com">contact@oosira.com</a>
      </p>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments constituant la plateforme Oosira (textes, graphismes, logiciels, photographies,
        images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de
        données, etc.) ainsi que les éléments d&apos;infrastructure sont protégés par les dispositions du droit algérien
        relatives à la propriété intellectuelle.
      </p>
      <p>
        Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments
        du site, quel que soit le moyen ou le procédé utilisé, est interdite sauf autorisation écrite préalable.
      </p>

      <h2>5. Protection des données personnelles</h2>
      <p>
        Conformément à la <strong>loi n° 18-07 du 10 juin 2018</strong> relative à la protection des personnes
        physiques dans le traitement des données à caractère personnel, les utilisateurs disposent de droits
        sur leurs données. Pour plus de détails, consultez notre{' '}
        <a href="/confidentialite">Politique de confidentialité</a>.
      </p>

      <h2>6. Cookies</h2>
      <p>
        La plateforme utilise des cookies pour assurer son bon fonctionnement. Pour en savoir plus,
        consultez notre <a href="/cookies">Politique cookies</a>.
      </p>

      <h2>7. Loi applicable</h2>
      <p>
        Les présentes mentions légales sont régies par le droit algérien. Tout litige y afférent sera
        soumis à la compétence exclusive des tribunaux algériens.
      </p>
    </InfoPageShell>
  );
}
