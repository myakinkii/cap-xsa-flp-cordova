# cap-xsa-flp-cordova

This is a snapshot of solution internal monorepo for demo and educational purposes.

The structure is a sap cap cds project with some additional modules:

* db module contains regular cds artifacts
* srv module (gen folder added via cds build) contains service definitions and generic admin service with handlers
* srv_mobile (gen folder must be copied here) contains custom express app with endpoints for mobile apps (/coach and /client) with both cap (for /odata) and "native" express (for /rest ) handlers
* ui_fe* modules contain fiori elements apps (odata v2 via proxy) for admin flp
* flp and flp-Content are xsa flp site which consume fe apps via destinations
* ui5_clientApp and ui5_coachApp are runnable modules from which cordova apps are made

Pease find the sap blog post with more details here: https://blogs.sap.com/?p=1181310

Have fun and feel free to use the code as you please.