(function(){
"use strict";
if(window.__ZWM_FRENCH_RUNTIME__)return;
window.__ZWM_FRENCH_RUNTIME__=true;

var FR_KEY="zwm:french:v1";
var LANG_KEY="zwm-lang-v2";
var ADMIN_LANG_KEY="zwm:admin-lang:v1";
var WELCOME_KEY="zwm-welcome-seen-v3";

function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function isFrench(){return get(FR_KEY)==="1"}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}

var EXACT=Object.freeze({
"Home":"Accueil",
"Shop":"Boutique",
"Catalogue":"Catalogue",
"Products":"Produits",
"Product":"Produit",
"Recipes":"Recettes",
"Our story":"Notre histoire",
"Our Story":"Notre histoire",
"About & mission":"À propos & mission",
"Contact":"Contact",
"Contact & visit":"Contact & visite",
"Delivery & ordering":"Livraison & commandes",
"Delivery":"Livraison",
"Delivery info":"Infos de livraison",
"Delivery across Lebanon":"Livraison partout au Liban",
"Delivery all over Lebanon · Website checkout":"Livraison partout au Liban · commande via le site",
"Legal & Rewards":"Mentions légales & récompenses",
"Legal & privacy":"Mentions légales & confidentialité",
"Privacy Policy":"Politique de confidentialité",
"Terms of Service":"Conditions d’utilisation",
"Mouneh Points Rules 🌿":"Règles des Mouneh Points 🌿",
"Mouneh Points Rules":"Règles des Mouneh Points",
"Language":"Langue",
"Admin language":"Langue de l’administration",
"Primary navigation":"Navigation principale",
"Menu":"Menu",
"Open menu":"Ouvrir le menu",
"Close menu":"Fermer le menu",
"Open dashboard menu":"Ouvrir le menu du tableau de bord",
"Mobile owner navigation":"Navigation propriétaire sur mobile",
"More owner tools":"Plus d’outils propriétaire",
"Search the pantry":"Rechercher dans la mouneh",
"Search everything":"Tout rechercher",
"Search products ↓":"Rechercher des produits ↓",
"Search products ⌕":"Rechercher des produits ⌕",
"Search any product for the gift…":"Rechercher un produit pour le cadeau…",
"Search town, village or area":"Rechercher une ville, un village ou une zone",
"Search product, category or ID…":"Rechercher un produit, une catégorie ou un identifiant…",
"Search code, customer, area or product…":"Rechercher un code, un client, une zone ou un produit…",
"Search customer, phone or area…":"Rechercher un client, un téléphone ou une zone…",
"Search member, phone, code or tier…":"Rechercher un membre, un téléphone, un code ou un niveau…",
"Filter category":"Filtrer par catégorie",
"Filter status":"Filtrer par statut",
"Filter availability":"Filtrer par disponibilité",
"Filter delivery status":"Filtrer le statut de livraison",
"Filter order type":"Filtrer le type de commande",
"All categories":"Toutes les catégories",
"All statuses":"Tous les statuts",
"All types":"Tous les types",
"All availability":"Toutes les disponibilités",
"Browse all products":"Voir tous les produits",
"Browse all products ↗":"Voir tous les produits ↗",
"Browse gift products by category":"Parcourir les cadeaux par catégorie",
"Shop by category":"Acheter par catégorie",
"All product categories":"Toutes les catégories de produits",
"View all 21 categories ↗":"Voir les 21 catégories ↗",
"View categories ↗":"Voir les catégories ↗",
"Explore":"Explorer",
"Explore gifts ↗":"Explorer les cadeaux ↗",
"Explore Zayt w Mouneh":"Explorer Zayt w Mouneh",
"Open the pantry ↗":"Ouvrir la mouneh ↗",
"Jump into the pantry":"Entrer dans la mouneh",
"Start here":"Commencer ici",
"Make a gift":"Composer un cadeau",
"Build a gift ↓":"Composer un cadeau ↓",
"Build your own":"Composez le vôtre",
"Choose products":"Choisir les produits",
"Personalize it":"Personnalisez-le",
"Personalize & send":"Personnaliser & envoyer",
"See ready-made gifts":"Voir les cadeaux prêts à offrir",
"Gifts from the pantry":"Cadeaux de la mouneh",
"Lebanese pantry gifts":"Cadeaux de mouneh libanaise",
"Give a little piece of Lebanon.":"Offrez un petit morceau du Liban.",
"A thoughtful gift, made from the pantry.":"Un cadeau attentionné, composé à partir de la mouneh.",
"Choose a starting gift. Edit anything.":"Choisissez un cadeau de départ. Modifiez tout ce que vous voulez.",
"How gifting works":"Comment fonctionnent les cadeaux",
"Who is the gift for?":"À qui est destiné le cadeau ?",
"Gift card preview":"Aperçu de la carte cadeau",
"Gift theme":"Thème du cadeau",
"Card language":"Langue de la carte",
"Hide prices from the recipient":"Masquer les prix pour le destinataire",
"Clear gift":"Vider le cadeau",
"Add my cart":"Ajouter mon panier",
"Recipient, occasion, message and presentation.":"Destinataire, occasion, message et présentation.",
"Write a short note for the recipient…":"Écrivez un petit mot pour le destinataire…",
"Your gift stays editable until you continue to checkout. Prices shown are product totals; packing, delivery and the final total are confirmed at checkout.":"Votre cadeau reste modifiable jusqu’au passage au paiement. Les prix affichés correspondent aux produits ; l’emballage, la livraison et le total final sont confirmés au paiement.",
"Choose a ready-made gift or build your own. Pick the products, add the recipient details, then continue to website checkout.":"Choisissez un cadeau prêt à offrir ou composez le vôtre. Sélectionnez les produits, ajoutez les informations du destinataire, puis passez au commande via le site.",
"A pantry of Lebanese memory, curated with care.":"Une mouneh chargée de mémoire libanaise, sélectionnée avec soin.",
"A pantry rooted in place":"Une mouneh ancrée dans son terroir",
"From our pantry to your table.":"De notre mouneh à votre table.",
"Natural · Authentic · Lebanese":"Naturel · Authentique · Libanais",
"Since 2006, the pantry stays close.":"Depuis 2006, la mouneh reste à portée de main.",
"since":"depuis",
"Where the pantry comes from":"D’où vient notre mouneh",
"Provenance, made visible.":"Une provenance clairement indiquée.",
"See where it comes from ↘":"Voir d’où cela vient ↘",
"Pantry favourites.":"Les favoris de la mouneh.",
"Pantry essentials, ready to browse.":"Les essentiels de la mouneh, prêts à parcourir.",
"Most pantry products":"La plupart des produits de la mouneh",
"most products":"la plupart des produits",
"products":"produits",
"categories":"catégories",
"Shop online":"Acheter en ligne",
"One cart, ready to checkout":"Un panier, prêt pour le paiement",
"Checkout-ready order":"Commande prête pour le paiement",
"Your items and quantities are ready for website checkout.":"Vos articles et quantités sont prêts pour le commande sur le site.",
"Continue to website checkout":"Continuer vers le commande sur le site",
"Confirm on WhatsApp":"Confirmer sur WhatsApp",
"WhatsApp":"WhatsApp",
"WhatsApp us ↗":"Nous écrire sur WhatsApp ↗",
"Instagram":"Instagram",
"Call":"Appeler",
"Visit":"Visiter",
"Reach us directly":"Contactez-nous directement",
"Sebline · Get directions":"Sebline · Itinéraire",
"Sebline, Lebanon":"Sebline, Liban",
"Zayt w Mouneh · Sebline, Lebanon":"Zayt w Mouneh · Sebline, Liban",
"Questions, availability, delivery, gifts or an order you want help building — reach us directly.":"Questions, disponibilité, livraison, cadeaux ou aide pour composer une commande — contactez-nous directement.",
"Across Lebanon. Enter your area in the pantry list and we will confirm the delivery details.":"Partout au Liban. Indiquez votre zone dans la liste et nous confirmerons les détails de livraison.",
"Where do you deliver?":"Où livrez-vous ?",
"We deliver across Lebanon. Because delivery cost and timing depend on the area and the order, both are confirmed with you on WhatsApp before the order is final.":"Nous livrons partout au Liban. Comme le coût et le délai dépendent de la zone et de la commande, ils sont confirmés avec vous avant que la commande soit finalisée.",
"What does delivery cost?":"Combien coûte la livraison ?",
"The fee is confirmed on WhatsApp based on destination and order details; we do not show an invented flat rate.":"Les frais sont confirmés selon la destination et les détails de la commande ; nous n’affichons pas de tarif forfaitaire inventé.",
"How long does it take?":"Quel est le délai ?",
"Timing is confirmed with availability when you send the order request.":"Le délai est confirmé avec la disponibilité lorsque vous envoyez la demande de commande.",
"How do I pay?":"Comment payer ?",
"The available payment method is confirmed with the final order on WhatsApp.":"Le mode de paiement disponible est confirmé avec la commande finale.",
"What if something is unavailable?":"Que se passe-t-il si un produit est indisponible ?",
"We confirm availability before the order is final and can discuss a suitable substitution with you.":"Nous confirmons la disponibilité avant de finaliser la commande et pouvons convenir avec vous d’un remplacement adapté.",
"Can I send a gift?":"Puis-je envoyer un cadeau ?",
"Yes. Choose a ready-made idea or build your own gift and enter the recipient’s delivery area.":"Oui. Choisissez une idée prête à offrir ou composez votre cadeau, puis indiquez la zone de livraison du destinataire.",
"Close":"Fermer",
"Close cart":"Fermer le panier",
"Open cart":"Ouvrir le panier",
"Shopping cart":"Panier",
"Close product details":"Fermer les détails du produit",
"Close order details":"Fermer les détails de la commande",
"Decrease quantity":"Diminuer la quantité",
"Increase quantity":"Augmenter la quantité",
"Add to pantry":"Ajouter à la mouneh",
"Add pantry ingredients":"Ajouter les ingrédients de la mouneh",
"Add products before starting checkout.":"Ajoutez des produits avant de commencer le paiement.",
"Back to shop":"Retour à la boutique",
"Back to website":"Retour au site",
"Back to Zayt w Mouneh website":"Retour au site Zayt w Mouneh",
"Back to cart":"Retour au panier",
"← Back to cart":"← Retour au panier",
"Start shopping":"Commencer les achats",
"Continue shopping instead":"Continuer les achats",
"Checkout":"Paiement",
"Secure website order":"Commande sécurisée sur le site",
"Confirm your details once, see the complete total, and place your Zayt w Mouneh order directly on the website.":"Confirmez vos informations, consultez le total complet et passez votre commande Zayt w Mouneh directement sur le site.",
"Your pantry is empty.":"Votre mouneh est vide.",
"Customer":"Client",
"We only collect what is needed to fulfil your order.":"Nous recueillons uniquement les informations nécessaires pour exécuter votre commande.",
"Full name":"Nom complet",
"Name":"Nom",
"Your name":"Votre nom",
"Phone / WhatsApp":"Téléphone / WhatsApp",
"Phone / WhatsApp number":"Numéro de téléphone / WhatsApp",
"Email":"E-mail",
"Email (optional for guests)":"E-mail (facultatif pour les invités)",
"Send me order status updates on WhatsApp":"M’envoyer les mises à jour de la commande sur WhatsApp",
"Order updates only — confirmation, preparation, delivery and completion.":"Uniquement les mises à jour de commande — confirmation, préparation, livraison et finalisation.",
"Recipient name":"Nom du destinataire",
"Recipient phone":"Téléphone du destinataire",
"Use the recipient contact if the driver should call them directly.":"Utilisez le contact du destinataire si le livreur doit l’appeler directement.",
"Use the details a local driver would need in Lebanon.":"Indiquez les informations dont un livreur local a besoin au Liban.",
"Deliver to a saved address":"Livrer à une adresse enregistrée",
"Use another":"Utiliser une autre",
"Area / City":"Zone / Ville",
"Area in Lebanon":"Zone au Liban",
"Street / Neighborhood":"Rue / Quartier",
"Building / Residence":"Immeuble / Résidence",
"Floor / Apartment":"Étage / Appartement",
"Nearby landmark":"Point de repère à proximité",
"Delivery instructions":"Instructions de livraison",
"Save this address to my account":"Enregistrer cette adresse dans mon compte",
"Choose saved address":"Choisir une adresse enregistrée",
"Address":"Adresse",
"Addresses":"Adresses",
"Your addresses":"Vos adresses",
"Saved addresses":"Adresses enregistrées",
"No saved addresses yet.":"Aucune adresse enregistrée pour le moment.",
"Use as my default address":"Définir comme adresse par défaut",
"Use a reward voucher":"Utiliser un bon de récompense",
"Rewards":"Récompenses",
"Mouneh Points are finalized only after delivery and payment are confirmed.":"Les Mouneh Points ne deviennent définitifs qu’après confirmation de la livraison et du paiement.",
"Payment":"Paiement",
"Cash on Delivery":"Paiement à la livraison",
"Pay when your order arrives.":"Payez à la réception de votre commande.",
"More payment methods can be added later without changing your order history.":"D’autres moyens de paiement pourront être ajoutés sans modifier l’historique de vos commandes.",
"Order note":"Note de commande",
"Optional — tell us anything useful for this delivery.":"Facultatif — indiquez-nous toute information utile pour cette livraison.",
"Anything we should know?":"Y a-t-il quelque chose que nous devrions savoir ?",
"Review & place order":"Vérifier & passer la commande",
"Your final total is re-calculated securely on the server before the order is created.":"Votre total final est recalculé de manière sécurisée sur le serveur avant la création de la commande.",
"Order summary":"Récapitulatif de la commande",
"Subtotal":"Sous-total",
"Reward":"Récompense",
"Total":"Total",
"Place Order":"Passer la commande",
"Place Order — ":"Passer la commande — ",
"Need help?":"Besoin d’aide ?",
"Chat with us on WhatsApp":"Écrivez-nous sur WhatsApp",
"I agree to the Terms of Service, Privacy Policy and applicable order/delivery terms.":"J’accepte les Conditions d’utilisation, la Politique de confidentialité et les conditions applicables à la commande et à la livraison.",
"Open Terms of Service ↗":"Ouvrir les Conditions d’utilisation ↗",
"Open Privacy Policy ↗":"Ouvrir la Politique de confidentialité ↗",
"Guest checkout is available.":"Le paiement en tant qu’invité est disponible.",
"Sign in to earn points, save addresses and track orders more easily.":"Connectez-vous pour gagner des points, enregistrer des adresses et suivre vos commandes plus facilement.",
"Selected: ":"Sélectionné : ",
"Start typing your town, village or area. If it is not listed, type the exact area yourself.":"Commencez à saisir votre ville, village ou zone. Si elle n’apparaît pas, saisissez vous-même la zone exacte.",
"Earn about ":"Gagnez environ ",
"Sign in before placing the order to link it to your account.":"Connectez-vous avant de passer la commande pour la lier à votre compte.",
"About ":"Environ ",
" points after delivery":" points après la livraison",
"Wallet":"Portefeuille",
"No voucher":"Aucun bon",
"No reward voucher is available for this basket yet.":"Aucun bon de récompense n’est disponible pour ce panier pour le moment.",
"Unavailable":"Indisponible",
"Select area":"Choisir une zone",
"Free":"Gratuit",
"Delivery is temporarily paused":"La livraison est temporairement suspendue",
"Delivery is not currently available for this area":"La livraison n’est actuellement pas disponible dans cette zone",
"You unlocked FREE delivery ✓":"Vous avez débloqué la livraison GRATUITE ✓",
" more for FREE delivery 🚚":" de plus pour la livraison GRATUITE 🚚",
"Minimum order ":"Commande minimum ",
"Gift checkout":"Paiement du cadeau",
"Please select or enter a delivery area.":"Veuillez sélectionner ou saisir une zone de livraison.",
"Delivery is not currently available for this area. Choose another area or contact us.":"La livraison n’est actuellement pas disponible dans cette zone. Choisissez une autre zone ou contactez-nous.",
"Delivery is temporarily paused. Contact us for help.":"La livraison est temporairement suspendue. Contactez-nous pour obtenir de l’aide.",
"One item is no longer available. Return to your cart to review it.":"Un article n’est plus disponible. Retournez à votre panier pour le vérifier.",
"Placing order…":"Commande en cours…",
"Could not create the order.":"Impossible de créer la commande.",
"Request failed.":"La demande a échoué.",
"My Account":"Mon compte",
"Open My Account":"Ouvrir mon compte",
"Sign in to My Account":"Se connecter à mon compte",
"Sign in":"Se connecter",
"Sign out":"Se déconnecter",
"Create account":"Créer un compte",
"Create my account":"Créer mon compte",
"Create account & verify email":"Créer le compte & vérifier l’e-mail",
"Create your account.":"Créez votre compte.",
"Create your Zayt w Mouneh account":"Créer votre compte Zayt w Mouneh",
"Welcome back":"Bon retour",
"Welcome back.":"Bon retour.",
"Overview":"Aperçu",
"Points & Wallet":"Points & portefeuille",
"Mouneh Points & Wallet":"Mouneh Points & portefeuille",
"Orders":"Commandes",
"Orders & points":"Commandes & points",
"Orders & history":"Commandes & historique",
"Orders & deliveries":"Commandes & livraisons",
"Referrals":"Parrainages",
"Profile":"Profil",
"Profile & Security":"Profil & sécurité",
"Profile & birthday":"Profil & anniversaire",
"Password & security":"Mot de passe & sécurité",
"Overview with your balance, vouchers, orders and tier.":"Aperçu de votre solde, vos bons, vos commandes et votre niveau.",
"Mouneh Points & Wallet with reward progress.":"Mouneh Points & portefeuille avec votre progression de récompenses.",
"Referral progress with delivery-verified qualification.":"Progression des parrainages avec validation après livraison.",
"Profile, language and account security controls.":"Profil, langue et paramètres de sécurité du compte.",
"Everything in one place.":"Tout au même endroit.",
"One account keeps your Mouneh Points, vouchers, orders and referrals together.":"Un seul compte regroupe vos Mouneh Points, bons, commandes et parrainages.",
"One account for Mouneh Points, your wallet, rewards and future orders.":"Un compte unique pour vos Mouneh Points, votre portefeuille, vos récompenses et vos futures commandes.",
"Inside your dashboard":"Dans votre tableau de bord",
"Your Mouneh Points":"Vos Mouneh Points",
"Points balance":"Solde de points",
"Current balance":"Solde actuel",
"Next reward":"Prochaine récompense",
"Your next reward":"Votre prochaine récompense",
"Reward ladder":"Paliers de récompenses",
"Your reward ladder":"Vos paliers de récompenses",
"Your reward vouchers":"Vos bons de récompense",
"Your vouchers":"Vos bons",
"Available vouchers":"Bons disponibles",
"No vouchers yet. Redeem points to create one.":"Aucun bon pour le moment. Échangez vos points pour en créer un.",
"No vouchers yet. Open rewards when you are ready to redeem points.":"Aucun bon pour le moment. Ouvrez les récompenses lorsque vous souhaitez échanger vos points.",
"No available voucher for this basket yet.":"Aucun bon disponible pour ce panier pour le moment.",
"Turn points into vouchers":"Transformer les points en bons",
"Redeem reward":"Échanger la récompense",
"Redeem whenever you are ready.":"Échangez vos points quand vous le souhaitez.",
"Open rewards":"Ouvrir les récompenses",
"Open wallet":"Ouvrir le portefeuille",
"Open Points & Wallet":"Ouvrir Points & portefeuille",
"Open my Mouneh Points Wallet":"Ouvrir mon portefeuille Mouneh Points",
"Mouneh Points Wallet":"Portefeuille Mouneh Points",
"Mouneh Rewards":"Récompenses Mouneh",
"Join Mouneh Rewards":"Rejoindre les récompenses Mouneh",
"Earn points on paid, delivered orders, unlock rewards, referrals and member-only boosts.":"Gagnez des points sur les commandes payées et livrées, débloquez des récompenses, des parrainages et des bonus réservés aux membres.",
"Points become final only after delivery and payment are both confirmed.":"Les points deviennent définitifs uniquement lorsque la livraison et le paiement sont tous deux confirmés.",
"Your balance updates automatically after delivery and payment are both confirmed.":"Votre solde se met à jour automatiquement lorsque la livraison et le paiement sont confirmés.",
"Paid & delivered orders earn points. Redeem them into vouchers when you reach a reward level.":"Les commandes payées et livrées rapportent des points. Échangez-les contre des bons lorsque vous atteignez un palier.",
"Orders on account":"Commandes du compte",
"No account-linked orders yet.":"Aucune commande liée au compte pour le moment.",
"Recent activity":"Activité récente",
"Recent points activity":"Activité récente des points",
"No points activity yet.":"Aucune activité de points pour le moment.",
"Referral code (optional)":"Code de parrainage (facultatif)",
"Your referral code":"Votre code de parrainage",
"Your code":"Votre code",
"Copy invite link":"Copier le lien d’invitation",
"Invite a friend":"Inviter un ami",
"Invite friends, clearly":"Invitez des amis, simplement",
"Share your pantry code":"Partager votre code mouneh",
"Delivery and payment are verified in the owner order system before any referral points are issued.":"La livraison et le paiement sont vérifiés dans le système propriétaire avant l’attribution de points de parrainage.",
"Referral rewards are issued only after delivery and payment are verified in the owner order system. Same-phone and retroactive referrals do not qualify.":"Les récompenses de parrainage sont attribuées uniquement après vérification de la livraison et du paiement. Les parrainages avec le même numéro ou ajoutés rétroactivement ne sont pas éligibles.",
"Save profile":"Enregistrer le profil",
"Saving…":"Enregistrement…",
"Saved.":"Enregistré.",
"Birthday":"Anniversaire",
"Preferred language":"Langue préférée",
"Change password":"Changer le mot de passe",
"Current password":"Mot de passe actuel",
"New password":"Nouveau mot de passe",
"Confirm password":"Confirmer le mot de passe",
"Password updated.":"Mot de passe mis à jour.",
"Passwords do not match.":"Les mots de passe ne correspondent pas.",
"New password must be at least 8 characters.":"Le nouveau mot de passe doit contenir au moins 8 caractères.",
"Delete":"Supprimer",
"Edit":"Modifier",
"Default":"Par défaut",
"Make default":"Définir par défaut",
"Cancel":"Annuler",
"Refresh":"Actualiser",
"Loading your account…":"Chargement de votre compte…",
"Loading your Mouneh Points…":"Chargement de vos Mouneh Points…",
"Account services are still loading. Try again in a moment.":"Les services du compte sont encore en cours de chargement. Réessayez dans un instant.",
"Account services are temporarily unavailable. Please try again shortly.":"Les services du compte sont temporairement indisponibles. Veuillez réessayer bientôt.",
"Authentication failed.":"Échec de l’authentification.",
"Your sign-in session expired. Please sign in again.":"Votre session a expiré. Veuillez vous reconnecter.",
"Continue with Google":"Continuer avec Google",
"Opening Google…":"Ouverture de Google…",
"Google sign-in complete":"Connexion Google terminée",
"Finishing sign-in…":"Finalisation de la connexion…",
"Check your email":"Consultez votre e-mail",
"Resend verification email":"Renvoyer l’e-mail de vérification",
"Verify your email first":"Vérifiez d’abord votre e-mail",
"Sent. Check your inbox and spam folder.":"Envoyé. Vérifiez votre boîte de réception et vos courriers indésirables.",
"Terms of Service and confirm that I have read the Privacy Policy.":"Conditions d’utilisation et je confirme avoir lu la Politique de confidentialité.",
"I agree to the Terms of Service and confirm that I have read the Privacy Policy.":"J’accepte les Conditions d’utilisation et je confirme avoir lu la Politique de confidentialité.",
"Please agree to the Terms of Service and confirm that you have read the Privacy Policy to continue.":"Veuillez accepter les Conditions d’utilisation et confirmer que vous avez lu la Politique de confidentialité pour continuer.",
"Open Terms of Service":"Ouvrir les Conditions d’utilisation",
"Open Privacy Policy":"Ouvrir la Politique de confidentialité",
"Owner Console":"Console propriétaire",
"Owner dashboard":"Tableau de bord propriétaire",
"Owner workspace":"Espace propriétaire",
"Owner":"Propriétaire",
"Private owner access":"Accès propriétaire privé",
"Owner sign in":"Connexion propriétaire",
"Run the pantry":"Gérez la mouneh",
"from one place.":"depuis un seul endroit.",
"This area is not part of the customer website. Only approved owner accounts can continue.":"Cette zone ne fait pas partie du site client. Seuls les comptes propriétaire autorisés peuvent continuer.",
"Sign in securely":"Se connecter en toute sécurité",
"Create owner account":"Créer le compte propriétaire",
"Owner name":"Nom du propriétaire",
"Owner email":"E-mail du propriétaire",
"Create password":"Créer un mot de passe",
"One-time setup code":"Code de configuration à usage unique",
"Protected by authenticated sessions, an owner allowlist and database row-level security.":"Protégé par des sessions authentifiées, une liste d’autorisation propriétaire et la sécurité au niveau des lignes de la base de données.",
"View live site":"Voir le site en ligne",
"Refresh data":"Actualiser les données",
"Today at a glance":"Aujourd’hui en un coup d’œil",
"Keep the pantry accurate, clear and easy to order.":"Gardez la mouneh précise, claire et facile à commander.",
"Loading dashboard…":"Chargement du tableau de bord…",
"Manage products":"Gérer les produits",
"Live catalogue":"Catalogue en ligne",
"Products visible":"Produits visibles",
"Traffic":"Trafic",
"Last 7 days":"7 derniers jours",
"Last 30 days":"30 derniers jours",
"Last 90 days":"90 derniers jours",
"Page views":"Pages vues",
"Unique sessions":"Sessions uniques",
"WhatsApp clicks":"Clics WhatsApp",
"Product views":"Vues produit",
"Searches":"Recherches",
"Catalogue health":"État du catalogue",
"Needs attention":"Nécessite une attention",
"Missing photos":"Photos manquantes",
"Hidden products":"Produits masqués",
"Draft products":"Produits en brouillon",
"Recent owner activity":"Activité récente du propriétaire",
"Latest changes":"Dernières modifications",
"No changes yet.":"Aucune modification pour le moment.",
"No analytics yet.":"Aucune donnée d’analyse pour le moment.",
"Status":"Statut",
"Updated":"Mis à jour",
"Price":"Prix",
"Live":"En ligne",
"Edited":"Modifié",
"New":"Nouveau",
"Hidden":"Masqué",
"Draft":"Brouillon",
"Missing photo":"Photo manquante",
"Order received":"Commande reçue",
"Confirmed":"Confirmée",
"Approved by owner":"Approuvée par le propriétaire",
"Preparing":"En préparation",
"Being prepared":"En cours de préparation",
"Out for delivery":"En livraison",
"On the way":"En route",
"Delivered":"Livrée",
"Cancelled":"Annulée",
"Completed history":"Historique terminé",
"Active":"Actif",
"Past orders":"Commandes passées",
"All history":"Tout l’historique",
"Order history":"Historique des commandes",
"Order details":"Détails de la commande",
"Current status":"Statut actuel",
"Full order":"Commande complète",
"Customer notes":"Notes du client",
"No notes.":"Aucune note.",
"Gift details":"Détails du cadeau",
"Status history":"Historique des statuts",
"Order timeline":"Chronologie de la commande",
"Recipient":"Destinataire",
"Occasion":"Occasion",
"Packing":"Emballage",
"Theme":"Thème",
"Hide prices":"Masquer les prix",
"Yes":"Oui",
"No":"Non",
"Website content":"Contenu du site",
"Changes publish after save.":"Les modifications sont publiées après l’enregistrement.",
"Announcement bar":"Bandeau d’annonce",
"Top-of-site message":"Message en haut du site",
"English message":"Message en anglais",
"Arabic message":"Message en arabe",
"French message":"Message en français",
"WhatsApp destination":"Destination WhatsApp",
"WhatsApp number":"Numéro WhatsApp",
"Promo message":"Message promotionnel",
"Optional customer notice":"Avis client facultatif",
"English title":"Titre en anglais",
"Arabic title":"Titre en arabe",
"French title":"Titre en français",
"Save website content":"Enregistrer le contenu du site",
"Website analytics":"Analyse du site",
"Simple signals that help you improve the store.":"Des indicateurs simples pour vous aider à améliorer la boutique.",
"Daily traffic":"Trafic quotidien",
"Most viewed":"Les plus consultés",
"Top products":"Produits les plus consultés",
"Customer intent":"Intention client",
"Owner activity":"Activité propriétaire",
"Security":"Sécurité",
"Owner access":"Accès propriétaire",
"Protected":"Protégé",
"Signed in as":"Connecté en tant que",
"Authorization":"Autorisation",
"Session":"Session",
"Backend":"Système backend",
"Connection health":"État de la connexion",
"Checking":"Vérification",
"Checking…":"Vérification…",
"Database":"Base de données",
"Product images":"Images produits",
"Run health check":"Lancer le contrôle de santé",
"Data":"Données",
"Owner backups":"Sauvegardes propriétaire",
"Product editor":"Éditeur de produit",
"Product details":"Détails du produit",
"English name":"Nom anglais",
"Arabic name":"Nom arabe",
"French name":"Nom français",
"Product ID":"Identifiant produit",
"Original / supplier name":"Nom original / fournisseur",
"Sizes & prices":"Formats & prix",
"Visibility":"Visibilité",
"Visible to customers":"Visible pour les clients",
"Saved but not shown":"Enregistré mais non affiché",
"Temporarily removed":"Temporairement retiré",
"Product photo":"Photo du produit",
"Choose / replace":"Choisir / remplacer",
"Remove photo":"Supprimer la photo",
"Horizontal position":"Position horizontale",
"Vertical position":"Position verticale",
"Zoom":"Zoom",
"Reset framing":"Réinitialiser le cadrage",
"Quick checks":"Vérifications rapides",
"Correct category":"Catégorie correcte",
"At least one size and price":"Au moins un format et un prix",
"Clear product photo when available":"Photo produit nette lorsqu’elle est disponible",
"Hide product":"Masquer le produit",
"Restore base version":"Restaurer la version de base",
"Save product":"Enregistrer le produit",
"Size (EN)":"Format (EN)",
"Size (AR)":"Format (AR)",
"Price (USD)":"Prix (USD)",
"Remove size":"Supprimer le format",
"Base catalogue product":"Produit du catalogue de base",
"Dashboard-managed product":"Produit géré depuis le tableau de bord",
"New catalogue product":"Nouveau produit du catalogue",
"Base catalogue":"Catalogue de base",
"No items":"Aucun article",
"Connected":"Connecté",
"Configured":"Configuré",
"Healthy":"Sain",
"Error":"Erreur",
"Save":"Enregistrer",
"Could not save product.":"Impossible d’enregistrer le produit.",
"Product updated.":"Produit mis à jour.",
"Product added.":"Produit ajouté.",
"Product hidden from customers.":"Produit masqué pour les clients.",
"Uploading image…":"Téléversement de l’image…",
"Saved and published.":"Enregistré et publié.",
"Website content saved.":"Contenu du site enregistré.",
"Dashboard refreshed.":"Tableau de bord actualisé.",
"Backend health check passed.":"Contrôle du backend réussi.",
"One backend service needs attention.":"Un service backend nécessite une attention.",
"Sign-in failed.":"Échec de la connexion.",
"Signing in securely…":"Connexion sécurisée…",
"Opening owner dashboard…":"Ouverture du tableau de bord propriétaire…",
"Email or password is incorrect.":"L’e-mail ou le mot de passe est incorrect.",
"Owner session is no longer valid.":"La session propriétaire n’est plus valide.",
"Your owner session expired. Please sign in again.":"Votre session propriétaire a expiré. Veuillez vous reconnecter.",
"This account is not approved for owner access.":"Ce compte n’est pas autorisé à accéder à l’espace propriétaire.",
"Signed out.":"Déconnecté.",
"In stock":"En stock",
"Out of stock":"Rupture de stock",
"Coming soon":"Bientôt disponible",
"Condiments":"Condiments",
"Dates":"Dattes",
"Debsy Carob":"Debsy Carob",
"Distillates + Syrups":"Distillats + sirops",
"Dried Foods":"Produits séchés",
"Flour":"Farines",
"Grains":"Céréales",
"Herbs":"Herbes",
"Honey":"Miel",
"Molasses":"Mélasses",
"Mouneh":"Mouneh",
"Nuts + Seeds":"Noix + graines",
"Oils":"Huiles",
"Olive Oil":"Huile d’olive",
"Olives":"Olives",
"Pickles":"Légumes marinés",
"Pulses":"Légumineuses",
"Soap":"Savons",
"Spices":"Épices",
"Sweets + Candy":"Confiseries",
"Vinegars":"Vinaigres",
"Mon":"Lun",
"Tue":"Mar",
"Wed":"Mer",
"Thu":"Jeu",
"Fri":"Ven",
"Sat":"Sam",
"Sun":"Dim",
"Quick actions":"Actions rapides",
"What do you want to do?":"Que voulez-vous faire ?",
"Manual order":"Commande manuelle",
"Create promo":"Créer une promotion",
"Order command center":"Centre de gestion des commandes",
"Today":"Aujourd’hui",
"New orders":"Nouvelles commandes",
"Sales today":"Ventes aujourd’hui",
"Being handled":"En cours de traitement",
"Waiting 30m+":"En attente depuis 30 min+",
"Delivered today":"Livrées aujourd’hui",
"Customers":"Clients",
"Members":"Membres",
"Member":"Membre",
"Program":"Programme",
"Settings":"Paramètres",
"Activity":"Activité",
"Analytics":"Analyses",
"Website checkout":"Paiement sur le site",
"Effective":"En vigueur",
"Important":"Important",
"On this page":"Sur cette page",
"Short version":"En bref",
"Who we are":"Qui sommes-nous",
"Who we are and what this covers":"Qui nous sommes et ce que couvre cette politique",
"Data we collect":"Données que nous collectons",
"Information we collect":"Informations que nous collectons",
"Information you give us":"Informations que vous nous fournissez",
"Account and authentication information":"Informations de compte et d’authentification",
"Orders and Mouneh Points":"Commandes et Mouneh Points",
"Technical and usage information":"Informations techniques et d’utilisation",
"How we use it":"Comment nous les utilisons",
"How we use information":"Comment nous utilisons les informations",
"Sharing & providers":"Partage & prestataires",
"Who may receive or process information":"Qui peut recevoir ou traiter les informations",
"WhatsApp and third-party services":"WhatsApp et services tiers",
"Cookies and local browser storage":"Cookies et stockage local du navigateur",
"Retention":"Conservation",
"Your choices & rights":"Vos choix & droits",
"Your choices and rights":"Vos choix et vos droits",
"Children":"Enfants",
"Changes to this policy":"Modifications de cette politique",
"Privacy, explained clearly.":"La confidentialité, expliquée clairement.",
"Simple terms for a real pantry.":"Des conditions simples pour une vraie mouneh.",
"Terms sections":"Sections des conditions",
"Privacy policy sections":"Sections de la politique de confidentialité",
"Orders & confirmation":"Commandes & confirmation",
"Cancellations & issues":"Annulations & problèmes",
"Acceptance of these Terms":"Acceptation des présentes conditions",
"Customer accounts":"Comptes clients",
"Products, prices and order confirmation":"Produits, prix et confirmation de commande",
"Food information, allergens and storage":"Informations alimentaires, allergènes et conservation",
"Payment":"Paiement",
"Cancellations, damaged items and order problems":"Annulations, articles endommagés et problèmes de commande",
"Gifts":"Cadeaux",
"Mouneh Points Program Rules":"Règles du programme Mouneh Points",
"Current standard reward ladder":"Paliers de récompenses standards actuels",
"What counts toward points":"Ce qui compte pour les points",
"Tier calculation":"Calcul du niveau",
"Joining and bonuses":"Adhésion et bonus",
"Vouchers and the Mouneh Points Wallet":"Bons et portefeuille Mouneh Points",
"Cancellations, refunds and corrections":"Annulations, remboursements et corrections",
"Fair use and program changes":"Utilisation équitable et modifications du programme",
"Acceptable use":"Utilisation acceptable",
"Intellectual property":"Propriété intellectuelle",
"Third-party services":"Services tiers",
"Availability and limitation of liability":"Disponibilité et limitation de responsabilité",
"Changes to the service or these Terms":"Modifications du service ou des présentes conditions",
"Governing law":"Droit applicable",
"Base earning":"Gain de base",
"When points become yours":"Quand les points deviennent acquis",
"After delivery + payment":"Après livraison + paiement",
"Olive Circle":"Olive Circle",
"Golden Pantry":"Golden Pantry",
"Start earning quickly":"Commencez à gagner rapidement",
"Points":"Points",
"Voucher value":"Valeur du bon",
"Minimum eligible order":"Commande éligible minimum",
"Account & contact":"Compte & contact",
"Points balance & ledger":"Solde & historique des points",
"Delivered orders & annual spend":"Commandes livrées & dépenses annuelles",
"Wallet vouchers":"Bons du portefeuille",
"Bonus eligibility":"Éligibilité aux bonus",
"Why we use it":"Pourquoi nous les utilisons",
"What it affects":"Ce que cela affecte",
"Choose a ready-made pantry idea or build your own gift from the full catalogue. Review packing, availability, delivery and the final total in website checkout; WhatsApp is only for help or optional status updates.":"Choisissez une idée de mouneh prête à offrir ou composez votre propre cadeau dans tout le catalogue. Vérifiez l’emballage, la disponibilité, la livraison et le total final lors de la commande sur le site ; WhatsApp reste disponible uniquement pour l’aide ou les mises à jour facultatives.",
"Review availability, packing, delivery and the final total in checkout.":"Vérifiez la disponibilité, l’emballage, la livraison et le total final lors de la commande.",
"Add what you know now. Review the remaining delivery details in checkout.":"Ajoutez les informations que vous avez maintenant. Vérifiez les autres détails de livraison lors de la commande.",
"We deliver across Lebanon. Delivery cost and timing depend on the area and order details; review them in website checkout, and we will contact you only if something needs manual confirmation.":"Nous livrons partout au Liban. Les frais et le délai dépendent de la zone et des détails de la commande ; vérifiez-les lors de la commande sur le site, et nous ne vous contacterons que si une confirmation manuelle est nécessaire.",
"The delivery fee is calculated from the delivery area and order settings shown in checkout. If an area needs manual review, we will contact you before fulfilment.":"Les frais de livraison sont calculés selon la zone et les paramètres affichés lors de la commande. Si une zone nécessite une vérification manuelle, nous vous contacterons avant la préparation.",
"Available payment instructions are shown during checkout or on the order confirmation. If anything needs manual confirmation, we will contact you.":"Les instructions de paiement disponibles sont indiquées lors de la commande ou dans sa confirmation. Si une vérification manuelle est nécessaire, nous vous contacterons.",
"Adding products to the cart does not by itself guarantee acceptance or availability. Submitting website checkout creates an order request; the order becomes final when Zayt w Mouneh confirms it.":"Ajouter des produits au panier ne garantit pas à lui seul l’acceptation ni la disponibilité. La validation de la commande sur le site crée une demande de commande ; elle devient définitive lorsque Zayt w Mouneh la confirme.",
"Submitting website checkout creates an order request and order reference. A binding sale is not formed until Zayt w Mouneh confirms the order.":"Valider la commande sur le site crée une demande et une référence de commande. La vente n’est définitive qu’après confirmation par Zayt w Mouneh.",
"Prices are shown from the supplied retail list; final availability is verified when your order is reviewed.":"Les prix proviennent de la liste de vente fournie ; la disponibilité finale est vérifiée lors de l’examen de votre commande.",
"When you press a WhatsApp support link or opt in to WhatsApp order-status updates, you interact with WhatsApp/Meta. Information processed there is also subject to their services and privacy practices. Website orders themselves are submitted through Zayt w Mouneh checkout. The same third-party principle applies to Instagram, Google Maps, Google authentication, and other independent services.":"Lorsque vous utilisez un lien d’assistance WhatsApp ou choisissez de recevoir les mises à jour de statut sur WhatsApp, vous interagissez avec WhatsApp/Meta. Les informations traitées dans ce cadre sont également soumises à leurs services et pratiques de confidentialité. Les commandes sont elles-mêmes envoyées via la page de commande Zayt w Mouneh. Le même principe s’applique à Instagram, Google Maps, l’authentification Google et aux autres services indépendants.",
"Availability verified with your order":"Disponibilité vérifiée avec votre commande"
});

var CATEGORY_FR=Object.freeze({
"Condiments":"Condiments","Dates":"Dattes","Debsy Carob":"Debsy Carob","Distillates + Syrups":"Distillats + sirops",
"Dried Foods":"Produits séchés","Flour":"Farines","Grains":"Céréales","Herbs":"Herbes","Honey":"Miel","Molasses":"Mélasses",
"Mouneh":"Mouneh","Nuts + Seeds":"Noix + graines","Oils":"Huiles","Olive Oil":"Huile d’olive","Olives":"Olives",
"Pickles":"Légumes marinés","Pulses":"Légumineuses","Soap":"Savons","Spices":"Épices","Sweets + Candy":"Confiseries","Vinegars":"Vinaigres"
});

var NOUN=Object.freeze({
"Almond":"amande","Almonds":"amandes","Apple":"pomme","Apricot":"abricot","Avocado":"avocat","Barley":"orge","Bay":"laurier",
"Bee":"abeille","Bekaa":"Bekaa","Black Seed":"nigelle","Carob":"caroube","Castor Seed":"ricin","Cedar":"cèdre","Cherry":"cerise",
"Chia":"chia","Chicken":"poulet","Cinnamon":"cannelle","Coconut":"noix de coco","Coriander":"coriandre","Corn":"maïs",
"Cumin":"cumin","Date":"datte","Fennel":"fenouil","Fenugreek":"fenugrec","Fish":"poisson","Flax":"lin","Flower":"fleurs",
"Garlic":"ail","Ginger":"gingembre","Goat's-Milk":"lait de chèvre","Grape":"raisin","Hazelnut":"noisette","Honey":"miel",
"Jallab":"jallab","Lemon":"citron","Lentil":"lentille","Lentils":"lentilles","Meat":"viande","Mint":"menthe","Mulberry":"mûre",
"Myrtle":"myrte","Nigella":"nigelle","Nutmeg":"muscade","Oat":"avoine","Oats":"avoine","Olive":"olive","Onion":"oignon",
"Orange Blossom":"fleur d’oranger","Peanut":"cacahuète","Peanuts":"cacahuètes","Pomegranate":"grenade","Potato":"pomme de terre",
"Pumpkin":"citrouille","Quince":"coing","Rice":"riz","Rose":"rose","Rosemary":"romarin","Sesame":"sésame","Strawberry":"fraise",
"Sunflower":"tournesol","Sweet Almond":"amande douce","Thyme":"thym","Tomato":"tomate","Turmeric":"curcuma","Walnut":"noix",
"Walnuts":"noix","Wheat":"blé","Wild Thistle":"chardon sauvage","White":"blanc"
});

function noun(s){
  if(NOUN[s])return NOUN[s];
  return String(s).replace(/\bBlack\b/g,"noir").replace(/\bWhite\b/g,"blanc").replace(/\bGreen\b/g,"vert").replace(/\bBrown\b/g,"brun")
    .replace(/\bRed\b/g,"rouge").replace(/\bRaw\b/g,"cru").replace(/\bWhole\b/g,"entier").replace(/\bGround\b/g,"moulu")
    .replace(/\bDried\b/g,"séché").replace(/\bFine\b/g,"fin").replace(/\bCoarse\b/g,"gros").replace(/\bLarge\b/g,"gros")
    .replace(/\bSpicy\b/g,"épicé").replace(/\bSweet\b/g,"doux").replace(/\bBitter\b/g,"amer");
}
function productFr(s){
  var x=String(s||"");
  var special={
    "Extra Virgin Olive Oil":"Huile d’olive extra vierge","Citric Acid (Lemon Salt)":"Acide citrique (sel de citron)",
    "Baking Powder":"Levure chimique","Brown Sugar":"Sucre brun","Icing Sugar":"Sucre glace","Iodized Salt":"Sel iodé",
    "Sea Salt":"Sel marin","Himalayan Salt":"Sel de l’Himalaya","Rock Sugar":"Sucre candi","White Sugar":"Sucre blanc",
    "Date Paste":"Pâte de dattes","Tahini":"Tahini","Freekeh":"Freekeh","Sumac":"Sumac","Allspice":"Piment de la Jamaïque",
    "Mahleb":"Mahleb","Frankincense":"Encens","Vanilla":"Vanille","Vermicelli":"Vermicelles","Semolina":"Semoule",
    "Popcorn":"Maïs à éclater","Walnuts":"Noix","Prunes":"Pruneaux","Barberries":"Épine-vinette","Cranberries":"Canneberges",
    "Goji Berries":"Baies de goji","Dried Apricots":"Abricots secs","Dried Figs":"Figues sèches","Sun-Dried Tomatoes":"Tomates séchées au soleil",
    "Orange Blossom Water":"Eau de fleur d’oranger","Rose Water":"Eau de rose","Pomegranate Molasses":"Mélasse de grenade",
    "Grape Molasses":"Mélasse de raisin","Tomato Paste":"Concentré de tomate","Spicy Red Pepper Paste":"Pâte de poivron rouge épicée",
    "Sweet Red Pepper Paste":"Pâte de poivron rouge douce","Grape Leaves":"Feuilles de vigne","Grape Leaves in Water":"Feuilles de vigne dans l’eau",
    "Grape Leaves with Labneh":"Feuilles de vigne au labneh","Qawarma Preserved Meat":"Qawarma — viande confite",
    "Mixed Pickles":"Légumes marinés assortis","Pickled Cucumber":"Concombre mariné","Pickled Turnip":"Navet mariné",
    "Pine Nuts":"Pignons de pin","White Quinoa":"Quinoa blanc","Arabic Gum":"Gomme arabique","Bee Pollen":"Pollen d’abeille",
    "Honey with Honeycomb":"Miel avec rayon","Raw Propolis":"Propolis brute","Propolis with Olive Oil":"Propolis à l’huile d’olive",
    "Propolis with Ethanol":"Propolis à l’éthanol","Whole Wheat Flour":"Farine de blé complet","All-Purpose Flour":"Farine tout usage",
    "Farina Flour":"Farine de semoule fine","Zero Flour":"Farine zéro","Cracked Wheat":"Blé concassé","Whole Wheat Berries":"Grains de blé entier",
    "Long Grain Brown Rice":"Riz brun à grains longs","Fine Rice":"Riz fin","Mixed Grains":"Mélange de céréales",
    "Black Raisins":"Raisins secs noirs","Chilean Raisins":"Raisins secs chiliens","Ashlamish Raisins":"Raisins secs Ashlamish",
    "Nigella Seeds (Black Seed)":"Graines de nigelle","Unhulled Sesame Seeds":"Graines de sésame non décortiquées",
    "Toasted Sesame":"Sésame grillé","Raw Sesame":"Sésame cru","Pumpkin Seeds":"Graines de citrouille","Sunflower Seeds":"Graines de tournesol",
    "Fava Beans for Foul Mdammas":"Fèves pour foul mdammas","Large Chickpeas":"Gros pois chiches","Local Chickpeas":"Pois chiches locaux",
    "American Chickpeas":"Pois chiches américains","Split Lentils":"Lentilles cassées","Large Lentils":"Grosses lentilles","Australian Lentils":"Lentilles australiennes",
    "Dried Peas":"Pois secs","Broad White Beans":"Gros haricots blancs","Pine-Shaped Beans":"Haricots en forme de pignon",
    "Labneh Balls with Mint":"Boules de labneh à la menthe","Labneh Balls with Nigella Seeds":"Boules de labneh à la nigelle",
    "Labneh Balls with Za’atar":"Boules de labneh au za’atar","Plain Labneh Balls":"Boules de labneh nature","Spicy Labneh Balls":"Boules de labneh épicées",
    "Cow's-Milk Kishk - Bekaa":"Kishk au lait de vache — Bekaa","Goat's-Milk Kishk - Bekaa":"Kishk au lait de chèvre — Bekaa",
    "Zayt w Mouneh Kishk":"Kishk Zayt w Mouneh","Green Kishk with Walnuts":"Kishk vert aux noix","Manakish Za’atar":"Za’atar pour manakish",
    "Extra Baladi Za’atar":"Za’atar baladi extra","Aleppo Za’atar":"Za’atar d’Alep","Jordanian Za'atar Blend":"Mélange de za’atar jordanien",
    "Za’atar with Nuts":"Za’atar aux noix","Za’atar Shanklish":"Shanklish au za’atar","Spicy Shanklish":"Shanklish épicé",
    "Local Black Olives":"Olives noires locales","Local Green Olives":"Olives vertes locales","Bekaa Black Olives":"Olives noires de la Bekaa",
    "Bekaa Green Olives":"Olives vertes de la Bekaa","Koura Green Olives":"Olives vertes du Koura","Spicy Stuffed Green Olives":"Olives vertes farcies épicées",
    "Jarjir Olives":"Olives au jarjir","Extra-Coarse Brown Bulgur":"Boulgour brun extra gros","Extra-Coarse White Bulgur":"Boulgour blanc extra gros",
    "Coarse Brown Bulgur":"Boulgour brun gros","Coarse White Bulgur":"Boulgour blanc gros","Fine Brown Bulgur":"Boulgour brun fin","Fine White Bulgur":"Boulgour blanc fin",
    "Dried Moghrabieh":"Moghrabieh séchée","Golden Sila Basmati Rice":"Riz basmati Sila doré","Egyptian Rice":"Riz égyptien",
    "American Rice":"Riz américain","Baldo Italian Rice":"Riz italien Baldo","Sila Rice Xxl":"Riz Sila XXL",
    "Moringa Tea":"Thé au moringa","Green Tea":"Thé vert","Ceylon Tea":"Thé de Ceylan","Chamomile":"Camomille","Hibiscus":"Hibiscus",
    "Marjoram":"Marjolaine","Oregano":"Origan","Hyssop":"Hysope","Wormwood":"Absinthe","Senna":"Séné",
    "Dried Mint":"Menthe séchée","Dried Rosemary":"Romarin séché","Dried Rose Petals":"Pétales de rose séchés",
    "Myrtle Distillate":"Distillat de myrte","Hawthorn Distillate":"Distillat d’aubépine","Thyme Distillate":"Distillat de thym",
    "Jallab Syrup":"Sirop de jallab","Mulberry Syrup":"Sirop de mûre","Rose Syrup":"Sirop de rose","Sugar-Free Mulberry Syrup":"Sirop de mûre sans sucre",
    "Sugar-Free Jeleb":"Jallab sans sucre","Ceylon Cinnamon":"Cannelle de Ceylan","Cinnamon Sticks":"Bâtons de cannelle","Cinnamon":"Cannelle",
    "Whole Cardamom":"Cardamome entière","Ground Cardamom":"Cardamome moulue","Whole Nutmeg":"Noix de muscade entière","Ground Nutmeg":"Muscade moulue",
    "Cumin Seeds":"Graines de cumin","Ground Cumin":"Cumin moulu","Coriander Seeds":"Graines de coriandre","Ground Coriander":"Coriandre moulue",
    "Fennel Seeds":"Graines de fenouil","Ground Fennel":"Fenouil moulu","Anise Seeds":"Graines d’anis","Star Anise":"Badiane",
    "Fenugreek Seeds":"Graines de fenugrec","Cloves":"Clous de girofle","Whole Black Pepper":"Poivre noir en grains","White Pepper":"Poivre blanc",
    "Hot Black Pepper":"Poivre noir piquant","Coarse Hot Pepper":"Piment fort grossier","Fine Hot Pepper":"Piment fort fin","Ginger":"Gingembre",
    "Garlic Powder":"Ail en poudre","Onion Powder":"Oignon en poudre","Turmeric":"Curcuma","Whole Turmeric":"Curcuma entier",
    "Dried Lime":"Citron vert séché","Ground Dried Lime":"Citron vert séché moulu","Paprika":"Paprika","Seven Spice":"Sept épices",
    "Mild Curry":"Curry doux","Hot Curry":"Curry piquant","Flower Honey":"Miel de fleurs","Cedar Honey":"Miel de cèdre",
    "Oak Honey":"Miel de chêne","Wild Thistle Honey":"Miel de chardon sauvage","Avocado & Orange Blossom Honey":"Miel d’avocat et de fleur d’oranger",
    "White Honey Blend":"Mélange de miel blanc","Zayt w Mouneh White Honey Blend":"Mélange de miel blanc Zayt w Mouneh",
    "Immune Boosting Honey Blend":"Mélange de miel pour l’immunité","Mounet El Nahel Honey Blend":"Mélange de miel Mounet El Nahel",
    "Bitter Almond Oil":"Huile d’amande amère","Sweet Almond Oil":"Huile d’amande douce","Black Seed Oil":"Huile de nigelle",
    "Coconut Oil":"Huile de coco","Argan Oil":"Huile d’argan","Pumpkin Seed Oil":"Huile de pépins de courge","Rose Oil":"Huile de rose",
    "Rosemary Oil":"Huile de romarin","Viventia Rosemary Oil":"Huile de romarin Viventia","Castor Seed Oil":"Huile de ricin",
    "Olive Oil Soap":"Savon à l’huile d’olive","Honey Soap":"Savon au miel","Bee Pollen Soap":"Savon au pollen d’abeille","Charcoal Soap":"Savon au charbon",
    "Hive Soap":"Savon de la ruche","Apple Vinegar":"Vinaigre de pomme","Grape Vinegar":"Vinaigre de raisin","Honey Vinegar":"Vinaigre de miel",
    "Bekaa Verjuice":"Verjus de la Bekaa","Koura Verjuice":"Verjus du Koura"
  };
  if(special[x])return special[x];
  var m;
  if((m=x.match(/^(.+) Seasoning$/)))return "Assaisonnement pour "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Spice Mix$/)))return "Mélange d’épices "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Flour$/)))return "Farine de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Oil$/)))return "Huile de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Honey$/)))return "Miel de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Jam$/)))return "Confiture de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Vinegar$/)))return "Vinaigre de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Syrup$/)))return "Sirop de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Distillate$/)))return "Distillat de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^(.+) Seeds$/)))return "Graines de "+noun(m[1]).toLowerCase();
  if((m=x.match(/^Pickled (.+)$/)))return noun(m[1])+" mariné";
  if((m=x.match(/^Dried (.+)$/)))return noun(m[1])+" séché";
  if((m=x.match(/^(.+) Soap$/)))return "Savon "+noun(m[1]).toLowerCase();
  return x;
}

function dynamicFr(raw){
  var s=String(raw==null?"":raw);
  var t=s.trim();
  if(!t)return s;
  if(EXACT[t])return s.replace(t,EXACT[t]);
  if(CATEGORY_FR[t])return s.replace(t,CATEGORY_FR[t]);
  try{
    if(Array.isArray(window.PRODUCTS_DATA)){
      for(var i=0;i<window.PRODUCTS_DATA.length;i++){
        var p=window.PRODUCTS_DATA[i];
        if(p&&p.nameEn===t)return s.replace(t,productFr(t));
      }
    }
  }catch(e){}
  var m;
  if((m=t.match(/^(\d+)\s+members?$/i)))return s.replace(t,m[1]+" membres");
  if((m=t.match(/^(\d+)\s+products?$/i)))return s.replace(t,m[1]+" produits");
  if((m=t.match(/^(\d+)\s+orders?$/i)))return s.replace(t,m[1]+" commandes");
  if((m=t.match(/^(\d+)\s+points?$/i)))return s.replace(t,m[1]+" points");
  if((m=t.match(/^(\d+)\s+items?$/i)))return s.replace(t,m[1]+" articles");
  if((m=t.match(/^Qty\s+(\d+)$/i)))return s.replace(t,"Qté "+m[1]);
  if((m=t.match(/^(\$[\d,.]+)\s+off$/i)))return s.replace(t,m[1]+" de réduction");
  if((m=t.match(/^(\$[\d,.]+)\s+minimum$/i)))return s.replace(t,"minimum "+m[1]);
  if((m=t.match(/^(\d+)\s+points to go$/i)))return s.replace(t,"Encore "+m[1]+" points");
  if((m=t.match(/^(\d+)\s+points until\s+(.+)$/i)))return s.replace(t,m[1]+" points avant "+m[2]);
  if((m=t.match(/^from\s+(\$[\d,.]+)$/i)))return s.replace(t,"à partir de "+m[1]);
  if(t==="Featured")return s.replace(t,"À la une");
  if(t==="Ready-made gift")return s.replace(t,"Cadeau prêt à offrir");
  if(t==="Choose this gift")return s.replace(t,"Choisir ce cadeau");
  if(t==="In stock")return s.replace(t,"En stock");
  if(t==="Out of stock")return s.replace(t,"Rupture de stock");
  if(t==="Coming soon")return s.replace(t,"Bientôt disponible");
  if(t==="Size not listed")return s.replace(t,"Format non indiqué");
  return s;
}

function shouldSkip(el){
  if(!el||el.nodeType!==1)return false;
  if(el.matches("script,style,noscript,code,pre,textarea,[data-no-fr]"))return true;
  if(el.closest("script,style,noscript,code,pre,textarea,[data-no-fr]"))return true;
  if(el.closest(".only-ar,[lang='ar']"))return true;
  return false;
}
function translateTextNode(node){
  if(!node||node.nodeType!==3||!node.parentElement||shouldSkip(node.parentElement))return;
  var next=dynamicFr(node.nodeValue);
  if(next!==node.nodeValue)node.nodeValue=next;
}
function translateAttrs(el){
  if(!el||el.nodeType!==1||shouldSkip(el))return;
  ["aria-label","title","placeholder"].forEach(function(a){
    var v=el.getAttribute(a);
    if(!v)return;
    var n=dynamicFr(v);
    if(n!==v)el.setAttribute(a,n);
  });
}
function walk(root){
  if(!root)return;
  if(root.nodeType===3){translateTextNode(root);return}
  if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
  if(root.nodeType===1){if(shouldSkip(root))return;translateAttrs(root)}
  var w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  var n;
  while((n=w.nextNode())){
    if(n.nodeType===3)translateTextNode(n);else translateAttrs(n);
  }
}

function setDocFrench(){
  document.documentElement.lang="fr";
  document.documentElement.dir="ltr";
  document.documentElement.dataset.zwmFr="1";
  document.body&&document.body.classList.remove("admin-rtl");
  if(document.title)document.title=dynamicFr(document.title);
}
function addStyles(){
  if(document.getElementById("zwmFrenchStyles"))return;
  var st=document.createElement("style");
  st.id="zwmFrenchStyles";
  st.textContent=".fr-language-ready{position:relative}.fr-lang-button{white-space:nowrap}.fr-globe-toggle{display:none!important;align-items:center;justify-content:center;min-width:34px;min-height:34px;padding:0 8px}.fr-globe-menu{display:none;position:absolute;top:calc(100% + 8px);right:0;z-index:9999;min-width:150px;padding:6px;border:1px solid rgba(0,0,0,.12);border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(0,0,0,.14)}.fr-globe-menu.is-open{display:grid;gap:4px}.fr-globe-menu button{width:100%;text-align:left;padding:9px 10px;border:0;border-radius:8px;background:transparent;cursor:pointer}.fr-globe-menu button.is-active{font-weight:700;background:rgba(0,0,0,.06)}@media(max-width:680px){.fr-language-ready>button:not(.fr-globe-toggle){display:none!important}.fr-language-ready>.fr-globe-toggle{display:inline-flex!important}.fr-language-ready>.fr-globe-menu.is-open{display:grid!important}}";
  document.head.appendChild(st);
}
function choiceButton(code,label){
  var b=document.createElement("button");
  b.type="button";b.dataset.frSet=code;b.textContent=label;b.className="fr-menu-choice";
  if((code==="fr"&&isFrench())||(code!=="fr"&&!isFrench()&&get(LANG_KEY)===code))b.classList.add("is-active");
  return b;
}
function prepareGroup(group,kind){
  if(!group||group.dataset.frReady==="1")return;
  group.dataset.frReady="1";group.classList.add("fr-language-ready");
  var fr=document.createElement("button");
  fr.type="button";fr.className="fr-lang-button";fr.dataset.frSet="fr";fr.textContent="FR";fr.setAttribute("aria-label","Français");
  if(isFrench())fr.classList.add("is-active");
  group.appendChild(fr);
  var globe=document.createElement("button");
  globe.type="button";globe.className="fr-globe-toggle";globe.dataset.frMenuToggle="1";globe.textContent="🌐";globe.setAttribute("aria-label","Changer de langue");globe.setAttribute("aria-expanded","false");
  group.appendChild(globe);
  var menu=document.createElement("div");menu.className="fr-globe-menu";menu.setAttribute("role","menu");
  menu.appendChild(choiceButton("en","English"));menu.appendChild(choiceButton("ar","العربية"));menu.appendChild(choiceButton("fr","Français"));
  group.appendChild(menu);
  if(isFrench())group.querySelectorAll("[data-lang],[data-commerce-lang],[data-admin-lang]").forEach(function(b){b.classList.remove("is-active")});
}
function ensureControls(){
  document.querySelectorAll(".language-switch,.commerce-lang,.admin-language-switch,.topbar-language-toggle").forEach(function(g){prepareGroup(g)});
  var wrap=document.querySelector(".welcome-language-options");
  if(wrap&&!wrap.querySelector("[data-fr-welcome]")){
    var b=document.createElement("button");
    b.type="button";b.className="welcome-language-button";b.dataset.frWelcome="1";b.setAttribute("aria-label","Continuer en français");
    b.innerHTML='<span class="welcome-lang-monogram">FR</span><span class="welcome-lang-copy"><strong>Français</strong><small>Continuer en français</small></span><b class="welcome-lang-arrow" aria-hidden="true">→</b>';
    wrap.appendChild(b);
  }
}
function switchLocale(code,welcome){
  if(welcome)set(WELCOME_KEY,"1");
  if(code==="fr"){
    set(FR_KEY,"1");set(LANG_KEY,"en");set(ADMIN_LANG_KEY,"en");
  }else{
    del(FR_KEY);set(LANG_KEY,code==="ar"?"ar":"en");set(ADMIN_LANG_KEY,code==="ar"?"ar":"en");
  }
  location.reload();
}

document.addEventListener("click",function(e){
  var toggle=e.target.closest("[data-fr-menu-toggle]");
  if(toggle){
    e.preventDefault();e.stopImmediatePropagation();
    var menu=toggle.parentElement&&toggle.parentElement.querySelector(".fr-globe-menu");
    if(menu){var open=!menu.classList.contains("is-open");document.querySelectorAll(".fr-globe-menu.is-open").forEach(function(x){x.classList.remove("is-open")});menu.classList.toggle("is-open",open);toggle.setAttribute("aria-expanded",open?"true":"false")}
    return;
  }
  var custom=e.target.closest("[data-fr-set]");
  if(custom){
    e.preventDefault();e.stopImmediatePropagation();switchLocale(custom.dataset.frSet,false);return;
  }
  var welcomeFr=e.target.closest("[data-fr-welcome]");
  if(welcomeFr){
    e.preventDefault();e.stopImmediatePropagation();switchLocale("fr",true);return;
  }
  if(isFrench()){
    var native=e.target.closest("[data-lang],[data-commerce-lang],[data-admin-lang],[data-welcome-lang]");
    if(native){
      var code=native.dataset.lang||native.dataset.commerceLang||native.dataset.adminLang||native.dataset.welcomeLang;
      if(code==="en"||code==="ar"){e.preventDefault();e.stopImmediatePropagation();switchLocale(code,!!native.dataset.welcomeLang);return}
    }
  }
},true);

function boot(){
  addStyles();ensureControls();
  if(!isFrench())return;
  setDocFrench();walk(document.body);
  var queued=false;
  var observer=new MutationObserver(function(list){
    if(queued)return;queued=true;
    requestAnimationFrame(function(){
      queued=false;ensureControls();
      list.forEach(function(m){
        m.addedNodes&&m.addedNodes.forEach(function(n){walk(n)});
        if(m.type==="characterData")translateTextNode(m.target);
        if(m.type==="attributes")translateAttrs(m.target);
      });
      setDocFrench();
    });
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["aria-label","title","placeholder"]});
  setTimeout(function(){ensureControls();walk(document.body);setDocFrench()},80);
  setTimeout(function(){ensureControls();walk(document.body);setDocFrench()},450);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();