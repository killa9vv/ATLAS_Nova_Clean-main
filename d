warning: in the working copy of 'backend/prisma/migrations/migration_lock.toml', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/backend/package-lock.json b/backend/package-lock.json[m
[1mindex ea2eec5..e2aa3e6 100644[m
[1m--- a/backend/package-lock.json[m
[1m+++ b/backend/package-lock.json[m
[36m@@ -12,11 +12,16 @@[m
         "@nestjs/common": "^10.4.4",[m
         "@nestjs/config": "^3.2.2",[m
         "@nestjs/core": "^10.4.4",[m
[32m+[m[32m        "@nestjs/jwt": "^11.0.2",[m
[32m+[m[32m        "@nestjs/passport": "^11.0.5",[m
         "@nestjs/platform-express": "^10.4.4",[m
         "@prisma/client": "^5.19.1",[m
         "axios": "^1.7.7",[m
[32m+[m[32m        "bcrypt": "^6.0.0",[m
         "class-transformer": "^0.5.1",[m
         "class-validator": "^0.14.1",[m
[32m+[m[32m        "passport": "^0.7.0",[m
[32m+[m[32m        "passport-jwt": "^4.0.1",[m
         "reflect-metadata": "^0.2.2",[m
         "rxjs": "^7.8.1"[m
       },[m
[36m@@ -24,9 +29,11 @@[m
         "@nestjs/cli": "^10.4.5",[m
         "@nestjs/schematics": "^10.1.4",[m
         "@nestjs/testing": "^10.4.4",[m
[32m+[m[32m        "@types/bcrypt": "^6.0.0",[m
         "@types/express": "^4.17.21",[m
         "@types/jest": "^29.5.13",[m
         "@types/node": "^20.16.5",[m
[32m+[m[32m        "@types/passport-jwt": "^4.0.1",[m
         "@types/supertest": "^7.2.1",[m
         "@typescript-eslint/eslint-plugin": "^8.5.0",[m
         "@typescript-eslint/parser": "^8.5.0",[m
[36m@@ -1977,6 +1984,29 @@[m
         }[m
       }[m
     },[m
[32m+[m[32m    "node_modules/@nestjs/jwt": {[m
[32m+[m[32m      "version": "11.0.2",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@nestjs/jwt/-/jwt-11.0.2.tgz",[m
[32m+[m[32m      "integrity": "sha512-rK8aE/3/Ma45gAWfCksAXUNbOoSOUudU0Kn3rT39htPF7wsYXtKfjALKeKKJbFrIWbLjsbqfXX5bIJNvgBugGA==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@types/jsonwebtoken": "9.0.10",[m
[32m+[m[32m        "jsonwebtoken": "9.0.3"[m
[32m+[m[32m      },[m
[32m+[m[32m      "peerDependencies": {[m
[32m+[m[32m        "@nestjs/common": "^8.0.0 || ^9.0.0 || ^10.0.0 || ^11.0.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/@nestjs/passport": {[m
[32m+[m[32m      "version": "11.0.5",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@nestjs/passport/-/passport-11.0.5.tgz",[m
[32m+[m[32m      "integrity": "sha512-ulQX6mbjlws92PIM15Naes4F4p2JoxGnIJuUsdXQPT+Oo2sqQmENEZXM7eYuimocfHnKlcfZOuyzbA33LwUlOQ==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "peerDependencies": {[m
[32m+[m[32m        "@nestjs/common": "^10.0.0 || ^11.0.0",[m
[32m+[m[32m        "passport": "^0.5.0 || ^0.6.0 || ^0.7.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/@nestjs/platform-express": {[m
       "version": "10.4.22",[m
       "resolved": "https://registry.npmjs.org/@nestjs/platform-express/-/platform-express-10.4.22.tgz",[m
[36m@@ -2345,6 +2375,16 @@[m
         "@babel/types": "^7.28.2"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/@types/bcrypt": {[m
[32m+[m[32m      "version": "6.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/bcrypt/-/bcrypt-6.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-/oJGukuH3D2+D+3H4JWLaAsJ/ji86dhRidzZ/Od7H/i8g+aCmvkeCc6Ni/f9uxGLSQVCRZkX2/lqEFG2BvWtlQ==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@types/node": "*"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/@types/body-parser": {[m
       "version": "1.19.6",[m
       "resolved": "https://registry.npmjs.org/@types/body-parser/-/body-parser-1.19.6.tgz",[m
[36m@@ -2490,6 +2530,16 @@[m
       "dev": true,[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/@types/jsonwebtoken": {[m
[32m+[m[32m      "version": "9.0.10",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/jsonwebtoken/-/jsonwebtoken-9.0.10.tgz",[m
[32m+[m[32m      "integrity": "sha512-asx5hIG9Qmf/1oStypjanR7iKTv0gXQ1Ov/jfrX6kS/EO0OFni8orbmGCn0672NHR3kXHwpAwR+B368ZGN/2rA==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@types/ms": "*",[m
[32m+[m[32m        "@types/node": "*"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/@types/methods": {[m
       "version": "1.1.4",[m
       "resolved": "https://registry.npmjs.org/@types/methods/-/methods-1.1.4.tgz",[m
[36m@@ -2504,16 +2554,53 @@[m
       "dev": true,[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/@types/ms": {[m
[32m+[m[32m      "version": "2.1.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/ms/-/ms-2.1.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-GsCCIZDE/p3i96vtEqx+7dBUGXrc7zeSK3wwPHIaRThS+9OhWIXRqzs4d6k1SVU8g91DrNRWxWUGhp5KXQb2VA==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
     "node_modules/@types/node": {[m
       "version": "20.19.43",[m
       "resolved": "https://registry.npmjs.org/@types/node/-/node-20.19.43.tgz",[m
       "integrity": "sha512-6oYBAi5ikg4Pl+kGsoYtawUMBT2zZMCvPNF7pVLnHZfd1zf38DRiWn/gT01RYCdUqkv7Fhr+C9ot4/tb+2sVvA==",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "dependencies": {[m
         "undici-types": "~6.21.0"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/@types/passport": {[m
[32m+[m[32m      "version": "1.0.17",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/passport/-/passport-1.0.17.tgz",[m
[32m+[m[32m      "integrity": "sha512-aciLyx+wDwT2t2/kJGJR2AEeBz0nJU4WuRX04Wu9Dqc5lSUtwu0WERPHYsLhF9PtseiAMPBGNUOtFjxZ56prsg==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@types/express": "*"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/@types/passport-jwt": {[m
[32m+[m[32m      "version": "4.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/passport-jwt/-/passport-jwt-4.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-Y0Ykz6nWP4jpxgEUYq8NoVZeCQPo1ZndJLfapI249g1jHChvRfZRO/LS3tqu26YgAS/laI1qx98sYGz0IalRXQ==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@types/jsonwebtoken": "*",[m
[32m+[m[32m        "@types/passport-strategy": "*"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/@types/passport-strategy": {[m
[32m+[m[32m      "version": "0.2.38",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/passport-strategy/-/passport-strategy-0.2.38.tgz",[m
[32m+[m[32m      "integrity": "sha512-GC6eMqqojOooq993Tmnmp7AUTbbQSgilyvpCYQjT+H6JfG/g6RGc7nXEniZlp0zyKJ0WUdOiZWLBZft9Yug1uA==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@types/express": "*",[m
[32m+[m[32m        "@types/passport": "*"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/@types/qs": {[m
       "version": "6.15.1",[m
       "resolved": "https://registry.npmjs.org/@types/qs/-/qs-6.15.1.tgz",[m
[36m@@ -3482,6 +3569,20 @@[m
         "node": ">=6.0.0"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/bcrypt": {[m
[32m+[m[32m      "version": "6.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/bcrypt/-/bcrypt-6.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-cU8v/EGSrnH+HnxV2z0J7/blxH8gq7Xh2JFT6Aroax7UohdmiJJlxApMxtKfuI7z68NvvVcmR78k2LbT6efhRg==",[m
[32m+[m[32m      "hasInstallScript": true,[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "node-addon-api": "^8.3.0",[m
[32m+[m[32m        "node-gyp-build": "^4.8.4"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">= 18"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/binary-extensions": {[m
       "version": "2.3.0",[m
       "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz",[m
[36m@@ -3654,6 +3755,12 @@[m
         "ieee754": "^1.1.13"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/buffer-equal-constant-time": {[m
[32m+[m[32m      "version": "1.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",[m
[32m+[m[32m      "license": "BSD-3-Clause"[m
[32m+[m[32m    },[m
     "node_modules/buffer-from": {[m
       "version": "1.1.2",[m
       "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",[m
[36m@@ -4430,6 +4537,15 @@[m
       "dev": true,[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/ecdsa-sig-formatter": {[m
[32m+[m[32m      "version": "1.0.11",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",[m
[32m+[m[32m      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",[m
[32m+[m[32m      "license": "Apache-2.0",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "safe-buffer": "^5.0.1"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/ee-first": {[m
       "version": "1.1.1",[m
       "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",[m
[36m@@ -7039,6 +7155,49 @@[m
         "graceful-fs": "^4.1.6"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/jsonwebtoken": {[m
[32m+[m[32m      "version": "9.0.3",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.3.tgz",[m
[32m+[m[32m      "integrity": "sha512-MT/xP0CrubFRNLNKvxJ2BYfy53Zkm++5bX9dtuPbqAeQpTVe0MQTFhao8+Cp//EmJp244xt6Drw/GVEGCUj40g==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "jws": "^4.0.1",[m
[32m+[m[32m        "lodash.includes": "^4.3.0",[m
[32m+[m[32m        "lodash.isboolean": "^3.0.3",[m
[32m+[m[32m        "lodash.isinteger": "^4.0.4",[m
[32m+[m[32m        "lodash.isnumber": "^3.0.3",[m
[32m+[m[32m        "lodash.isplainobject": "^4.0.6",[m
[32m+[m[32m        "lodash.isstring": "^4.0.1",[m
[32m+[m[32m        "lodash.once": "^4.0.0",[m
[32m+[m[32m        "ms": "^2.1.1",[m
[32m+[m[32m        "semver": "^7.5.4"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=12",[m
[32m+[m[32m        "npm": ">=6"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/jwa": {[m
[32m+[m[32m      "version": "2.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "buffer-equal-constant-time": "^1.0.1",[m
[32m+[m[32m        "ecdsa-sig-formatter": "1.0.11",[m
[32m+[m[32m        "safe-buffer": "^5.0.1"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/jws": {[m
[32m+[m[32m      "version": "4.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-EKI/M/yqPncGUUh44xz0PxSidXFr/+r0pA70+gIYhjv+et7yxM+s29Y+VGDkovRofQem0fs7Uvf4+YmAdyRduA==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "jwa": "^2.0.1",[m
[32m+[m[32m        "safe-buffer": "^5.0.1"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/keyv": {[m
       "version": "4.5.4",[m
       "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz",[m
[36m@@ -7132,6 +7291,42 @@[m
       "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==",[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/lodash.includes": {[m
[32m+[m[32m      "version": "4.3.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/lodash.isboolean": {[m
[32m+[m[32m      "version": "3.0.3",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",[m
[32m+[m[32m      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/lodash.isinteger": {[m
[32m+[m[32m      "version": "4.0.4",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",[m
[32m+[m[32m      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/lodash.isnumber": {[m
[32m+[m[32m      "version": "3.0.3",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",[m
[32m+[m[32m      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/lodash.isplainobject": {[m
[32m+[m[32m      "version": "4.0.6",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",[m
[32m+[m[32m      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/lodash.isstring": {[m
[32m+[m[32m      "version": "4.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
     "node_modules/lodash.memoize": {[m
       "version": "4.1.2",[m
       "resolved": "https://registry.npmjs.org/lodash.memoize/-/lodash.memoize-4.1.2.tgz",[m
[36m@@ -7146,6 +7341,12 @@[m
       "dev": true,[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/lodash.once": {[m
[32m+[m[32m      "version": "4.1.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
     "node_modules/log-symbols": {[m
       "version": "4.1.0",[m
       "resolved": "https://registry.npmjs.org/log-symbols/-/log-symbols-4.1.0.tgz",[m
[36m@@ -7569,6 +7770,15 @@[m
       "dev": true,[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/node-addon-api": {[m
[32m+[m[32m      "version": "8.9.2",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-8.9.2.tgz",[m
[32m+[m[32m      "integrity": "sha512-VijLXbi3UACN69I0JVXJsX4tjACjNoQDgv2gTF6sx2wWEi8tkSg2eX8p5gSIFi8z2+DL3oHmY6OyKce38SDolg==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": "^18 || ^20 || >= 21"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/node-emoji": {[m
       "version": "1.11.0",[m
       "resolved": "https://registry.npmjs.org/node-emoji/-/node-emoji-1.11.0.tgz",[m
[36m@@ -7599,6 +7809,17 @@[m
         }[m
       }[m
     },[m
[32m+[m[32m    "node_modules/node-gyp-build": {[m
[32m+[m[32m      "version": "4.8.4",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-4.8.4.tgz",[m
[32m+[m[32m      "integrity": "sha512-LA4ZjwlnUblHVgq0oBF3Jl/6h/Nvs5fzBLwdEF4nuxnFdsfajde4WfxtJr3CaiH+F6ewcIB/q4jQ4UzPyid+CQ==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "bin": {[m
[32m+[m[32m        "node-gyp-build": "bin.js",[m
[32m+[m[32m        "node-gyp-build-optional": "optional.js",[m
[32m+[m[32m        "node-gyp-build-test": "build-test.js"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/node-int64": {[m
       "version": "0.4.0",[m
       "resolved": "https://registry.npmjs.org/node-int64/-/node-int64-0.4.0.tgz",[m
[36m@@ -7840,6 +8061,42 @@[m
         "node": ">= 0.8"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/passport": {[m
[32m+[m[32m      "version": "0.7.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/passport/-/passport-0.7.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-cPLl+qZpSc+ireUvt+IzqbED1cHHkDoVYMo30jbJIdOOjQ1MQYZBPiNvmi8UM6lJuOpTPXJGZQk0DtC4y61MYQ==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "passport-strategy": "1.x.x",[m
[32m+[m[32m        "pause": "0.0.1",[m
[32m+[m[32m        "utils-merge": "^1.0.1"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">= 0.4.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "funding": {[m
[32m+[m[32m        "type": "github",[m
[32m+[m[32m        "url": "https://github.com/sponsors/jaredhanson"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/passport-jwt": {[m
[32m+[m[32m      "version": "4.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/passport-jwt/-/passport-jwt-4.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-UCKMDYhNuGOBE9/9Ycuoyh7vP6jpeTp/+sfMJl7nLff/t6dps+iaeE0hhNkKN8/HZHcJ7lCdOyDxHdDoxoSvdQ==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "jsonwebtoken": "^9.0.0",[m
[32m+[m[32m        "passport-strategy": "^1.0.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/passport-strategy": {[m
[32m+[m[32m      "version": "1.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/passport-strategy/-/passport-strategy-1.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-CB97UUvDKJde2V0KDWWB3lyf6PC3FaZP7YxZ2G8OAtn9p4HI9j9JLP9qjOGZFvyl8uwNT8qM+hGnz/n16NI7oA==",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">= 0.4.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/path-exists": {[m
       "version": "4.0.0",[m
       "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",[m
[36m@@ -7917,6 +8174,11 @@[m
         "node": ">=8"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/pause": {[m
[32m+[m[32m      "version": "0.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/pause/-/pause-0.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-KG8UEiEVkR3wGEb4m5yZkVCzigAD+cVEJck2CzYZO37ZGJfctvVptVO192MwrtPhzONn6go8ylnOdMhKqi4nfg=="[m
[32m+[m[32m    },[m
     "node_modules/pg": {[m
       "version": "8.22.0",[m
       "resolved": "https://registry.npmjs.org/pg/-/pg-8.22.0.tgz",[m
[36m@@ -8752,7 +9014,6 @@[m
       "version": "7.8.5",[m
       "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",[m
       "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",[m
[31m-      "dev": true,[m
       "license": "ISC",[m
       "bin": {[m
         "semver": "bin/semver.js"[m
[36m@@ -9938,7 +10199,6 @@[m
       "version": "6.21.0",[m
       "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",[m
       "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",[m
[31m-      "dev": true,[m
       "license": "MIT"[m
     },[m
     "node_modules/universalify": {[m
[1mdiff --git a/backend/package.json b/backend/package.json[m
[1mindex e2827db..95c0b71 100644[m
[1m--- a/backend/package.json[m
[1m+++ b/backend/package.json[m
[36m@@ -27,11 +27,16 @@[m
     "@nestjs/common": "^10.4.4",[m
     "@nestjs/config": "^3.2.2",[m
     "@nestjs/core": "^10.4.4",[m
[32m+[m[32m    "@nestjs/jwt": "^11.0.2",[m
[32m+[m[32m    "@nestjs/passport": "^11.0.5",[m
     "@nestjs/platform-express": "^10.4.4",[m
     "@prisma/client": "^5.19.1",[m
     "axios": "^1.7.7",[m
[32m+[m[32m    "bcrypt": "^6.0.0",[m
     "class-transformer": "^0.5.1",[m
     "class-validator": "^0.14.1",[m
[32m+[m[32m    "passport": "^0.7.0",[m
[32m+[m[32m    "passport-jwt": "^4.0.1",[m
     "reflect-metadata": "^0.2.2",[m
     "rxjs": "^7.8.1"[m
   },[m
[36m@@ -39,9 +44,11 @@[m
     "@nestjs/cli": "^10.4.5",[m
     "@nestjs/schematics": "^10.1.4",[m
     "@nestjs/testing": "^10.4.4",[m
[32m+[m[32m    "@types/bcrypt": "^6.0.0",[m
     "@types/express": "^4.17.21",[m
     "@types/jest": "^29.5.13",[m
     "@types/node": "^20.16.5",[m
[32m+[m[32m    "@types/passport-jwt": "^4.0.1",[m
     "@types/supertest": "^7.2.1",[m
     "@typescript-eslint/eslint-plugin": "^8.5.0",[m
     "@typescript-eslint/parser": "^8.5.0",[m
[1mdiff --git a/backend/prisma/schema.prisma b/backend/prisma/schema.prisma[m
[1mindex 0895a83..64cf754 100644[m
[1m--- a/backend/prisma/schema.prisma[m
[1m+++ b/backend/prisma/schema.prisma[m
[36m@@ -32,6 +32,7 @@[m [menum MetodoPagamento {[m
 [m
 enum PapelUsuario {[m
   ADMIN[m
[32m+[m[32m  CLIENTE[m
 }[m
 [m
 enum TipoDesconto {[m
[1mdiff --git a/backend/src/app.module.ts b/backend/src/app.module.ts[m
[1mindex 5040976..4307192 100644[m
[1m--- a/backend/src/app.module.ts[m
[1m+++ b/backend/src/app.module.ts[m
[36m@@ -6,7 +6,7 @@[m [mimport { ProdutosModule } from './produtos/infrastructure/produtos.module';[m
 import { CarrinhoModule } from './carrinho/infrastructure/carrinho.module';[m
 import { PedidosModule } from './pedidos/infrastructure/pedidos.module';[m
 import { PagamentosModule } from './pagamentos/infrastructure/pagamentos.module';[m
[31m-[m
[32m+[m[32mimport { AuthModule } from './auth/infrastructure/auth.module';[m
 @Module({[m
   imports: [[m
     ConfigModule.forRoot({ isGlobal: true }),[m
[36m@@ -15,6 +15,7 @@[m [mimport { PagamentosModule } from './pagamentos/infrastructure/pagamentos.module'[m
     CarrinhoModule,[m
     PedidosModule,[m
     PagamentosModule,[m
[32m+[m[32m    AuthModule,[m
   ],[m
 })[m
 export class AppModule {}[m
