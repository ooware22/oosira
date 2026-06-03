'use client';

import InfoPageShell from '@/components/InfoPageShell';

export default function ConfidentialitePage() {
  return (
    <InfoPageShell title="Politique de confidentialité">
      <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <p>
        La présente politique de confidentialité décrit la manière dont <strong>Oosira</strong> (ci-après « nous », « notre » ou « la plateforme »)
        collecte, utilise, stocke et protège vos données personnelles, conformément à la <strong>loi n° 18-07 du 10 juin 2018</strong> relative
        à la protection des personnes physiques dans le traitement des données à caractère personnel, et aux recommandations de
        l&apos;<strong>Autorité Nationale de Protection des Données à caractère Personnel (ANPDP)</strong>.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est la société éditrice d&apos;Oosira, dont les coordonnées figurent sur la page
        <a href="/mentions-legales"> Mentions légales</a>.
      </p>

      <h2>2. Données collectées</h2>
      <p>Dans le cadre de l&apos;utilisation de nos services, nous pouvons collecter les catégories de données suivantes :</p>
      <ul>
        <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse e-mail, numéro de téléphone.</li>
        <li><strong>Données professionnelles :</strong> parcours académique, expériences professionnelles, compétences, diplômes, certifications.</li>
        <li><strong>Données techniques :</strong> adresse IP, type de navigateur, données de connexion, cookies.</li>
        <li><strong>Données de contenu :</strong> CV et documents générés via la plateforme.</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont collectées pour les finalités suivantes :</p>
      <ul>
        <li>Création et gestion de votre compte utilisateur.</li>
        <li>Génération, stockage et export de CV professionnels.</li>
        <li>Amélioration de nos services et de l&apos;expérience utilisateur.</li>
        <li>Communication relative à votre compte (notifications, support).</li>
        <li>Respect de nos obligations légales et réglementaires.</li>
      </ul>

      <h2>4. Base légale du traitement</h2>
      <p>
        Conformément à la loi 18-07, le traitement de vos données repose sur :
      </p>
      <ul>
        <li>Votre <strong>consentement explicite</strong> lors de l&apos;inscription.</li>
        <li>L&apos;<strong>exécution contractuelle</strong> du service de création de CV.</li>
        <li>Notre <strong>intérêt légitime</strong> pour l&apos;amélioration et la sécurisation de la plateforme.</li>
      </ul>

      <h2>5. Durée de conservation</h2>
      <p>
        Vos données personnelles sont conservées pendant la durée de votre utilisation active de la plateforme,
        et supprimées dans un délai de <strong>12 mois</strong> après la dernière activité sur votre compte, sauf obligation légale de conservation.
      </p>

      <h2>6. Droits des personnes concernées</h2>
      <p>
        Conformément à la loi 18-07, vous disposez des droits suivants :
      </p>
      <ul>
        <li><strong>Droit d&apos;accès</strong> : obtenir la confirmation que vos données sont traitées et en demander une copie.</li>
        <li><strong>Droit de rectification</strong> : demander la correction de données inexactes ou incomplètes.</li>
        <li><strong>Droit de suppression</strong> : demander l&apos;effacement de vos données.</li>
        <li><strong>Droit d&apos;opposition</strong> : vous opposer au traitement de vos données pour des motifs légitimes.</li>
        <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré et couramment utilisé.</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@oosira.com">contact@oosira.com</a>
      </p>

      <h2>7. Hébergement et transferts</h2>
      <p>
        Vos données sont hébergées sur des serveurs sécurisés. Le réseau de diffusion de contenu (CDN) est assuré
        par Cloudflare. Aucun transfert de données hors du territoire national n&apos;est effectué sans les garanties
        appropriées prévues par la loi 18-07.
      </p>

      <h2>8. Sécurité des données</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données
        contre tout accès non autorisé, perte, altération ou divulgation, incluant le chiffrement des communications
        (HTTPS/TLS), la sécurisation des accès et la journalisation.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Pour plus d&apos;informations sur l&apos;utilisation des cookies, consultez notre <a href="/cookies">Politique cookies</a>.
      </p>

      <h2>10. Contact</h2>
      <p>
        Pour toute question relative à la protection de vos données, veuillez nous contacter à :
        <br /><a href="mailto:contact@oosira.com">contact@oosira.com</a>
      </p>
    </InfoPageShell>
  );
}
