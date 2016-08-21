# WhoseTurn
Application permettant de planifier à qui sera le tour de faire quelque chose...

## Fonctionalités :
- Historique + Planning
- Envoi mail automatique
- Template de mail
- Stockage des données
- Interface administration (utilisateur)
- Sondage présence
- Affichage photos

## TODOs :
- Notification d'indisponibilité
- Acceptation de l'échange de tour
- Savoir quand est le prochain tour de quelqu'un (idéalement avec auto-complétion)

## Configuration :
```javascript
{
  "mailServer": {
    "host": "",
    "port": "587",
    "secure": false,
    "requireTLS": true,
    "auth": {
      "user": "",
      "pass": ""
    },
    "tls": {
      "rejectUnauthorized": false,
      "secureProtocol": "SSLv3_method"
    }
  },
  "mailSender": "",
  "weeklyNotificationPattern": "0 14 * * 4",
  "pollStartPattern": "3 13 * * 3",
  "pollEndPattern": "30 12 * * 4",
  "mailFormat": "{0}@soprasteria.com",
  "externalMailFormat": "{0}@ext.soprasteria.com"
}
```