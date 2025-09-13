(define-non-fungible-token land-deed uint)

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-DEED-NOT-FOUND u101)
(define-constant ERR-INVALID-METAVERSE-ID u102)
(define-constant ERR-INVALID-COORDINATES u103)
(define-constant ERR-INVALID-TITLE u104)
(define-constant ERR-INVALID-DESCRIPTION u105)
(define-constant ERR-INVALID-ATTRIBUTES u106)
(define-constant ERR-DEED-ALREADY-EXISTS u107)
(define-constant ERR-INVALID-OWNER u108)
(define-constant ERR-MAX-DEEDS-EXCEEDED u109)
(define-constant ERR-INVALID-TIMESTAMP u110)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u111)
(define-constant ERR-INVALID-UPDATE-PARAM u112)
(define-constant ERR-UPDATE-NOT-ALLOWED u113)
(define-constant ERR-INVALID-STATUS u114)
(define-constant ERR-INVALID-LOCATION u115)
(define-constant ERR-INVALID-DIMENSIONS u116)
(define-constant ERR-INVALID-VALUE u117)
(define-constant ERR-INVALID-ROYALTY-RATE u118)
(define-constant ERR-INVALID-GRACE-PERIOD u119)
(define-constant ERR-INVALID-ROYALTY-RECEIVER u120)

(define-data-var last-deed-id uint u0)
(define-data-var max-deeds uint u10000)
(define-data-var mint-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map deed-metadata
  { deed-id: uint }
  {
    owner: principal,
    metaverse-id: (string-ascii 50),
    coordinates: (string-ascii 100),
    title: (string-ascii 100),
    description: (string-utf8 500),
    attributes: (string-ascii 200),
    location: (string-ascii 100),
    dimensions: (string-ascii 50),
    value: uint,
    royalty-rate: uint,
    royalty-receiver: principal,
    timestamp: uint,
    status: bool,
    grace-period: uint
  }
)

(define-map deeds-by-coordinates
  { metaverse-id: (string-ascii 50), coordinates: (string-ascii 100) }
  uint
)

(define-map deed-updates
  { deed-id: uint }
  {
    update-title: (string-ascii 100),
    update-description: (string-utf8 500),
    update-attributes: (string-ascii 200),
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-deed (id uint))
  (map-get? deed-metadata { deed-id: id })
)

(define-read-only (get-deed-updates (id uint))
  (map-get? deed-updates { deed-id: id })
)

(define-read-only (is-deed-registered (metaverse-id (string-ascii 50)) (coordinates (string-ascii 100)))
  (is-some (map-get? deeds-by-coordinates { metaverse-id: metaverse-id, coordinates: coordinates }))
)

(define-private (validate-metaverse-id (id (string-ascii 50)))
  (if (and (> (len id) u0) (<= (len id) u50))
      (ok true)
      (err ERR-INVALID-METAVERSE-ID))
)

(define-private (validate-coordinates (coords (string-ascii 100)))
  (if (and (> (len coords) u0) (<= (len coords) u100))
      (ok true)
      (err ERR-INVALID-COORDINATES))
)

(define-private (validate-title (title (string-ascii 100)))
  (if (and (> (len title) u0) (<= (len title) u100))
      (ok true)
      (err ERR-INVALID-TITLE))
)

(define-private (validate-description (desc (string-utf8 500)))
  (if (<= (len desc) u500)
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-attributes (attrs (string-ascii 200)))
  (if (<= (len attrs) u200)
      (ok true)
      (err ERR-INVALID-ATTRIBUTES))
)

(define-private (validate-location (loc (string-ascii 100)))
  (if (<= (len loc) u100)
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-dimensions (dims (string-ascii 50)))
  (if (<= (len dims) u50)
      (ok true)
      (err ERR-INVALID-DIMENSIONS))
)

(define-private (validate-value (val uint))
  (if (> val u0)
      (ok true)
      (err ERR-INVALID-VALUE))
)

(define-private (validate-royalty-rate (rate uint))
  (if (<= rate u10)
      (ok true)
      (err ERR-INVALID-ROYALTY-RATE))
)

(define-private (validate-grace-period (period uint))
  (if (<= period u30)
      (ok true)
      (err ERR-INVALID-GRACE-PERIOD))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-deeds (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-deeds new-max)
    (ok true)
  )
)

(define-public (set-mint-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set mint-fee new-fee)
    (ok true)
  )
)

(define-public (mint-deed
  (metaverse-id (string-ascii 50))
  (coordinates (string-ascii 100))
  (title (string-ascii 100))
  (description (string-utf8 500))
  (attributes (string-ascii 200))
  (location (string-ascii 100))
  (dimensions (string-ascii 50))
  (value uint)
  (royalty-rate uint)
  (royalty-receiver principal)
  (grace-period uint)
)
  (let (
        (next-id (+ (var-get last-deed-id) u1))
        (current-max (var-get max-deeds))
        (authority (var-get authority-contract))
      )
    (asserts! (< (var-get last-deed-id) current-max) (err ERR-MAX-DEEDS-EXCEEDED))
    (try! (validate-metaverse-id metaverse-id))
    (try! (validate-coordinates coordinates))
    (try! (validate-title title))
    (try! (validate-description description))
    (try! (validate-attributes attributes))
    (try! (validate-location location))
    (try! (validate-dimensions dimensions))
    (try! (validate-value value))
    (try! (validate-royalty-rate royalty-rate))
    (try! (validate-grace-period grace-period))
    (try! (validate-principal royalty-receiver))
    (asserts! (not (is-deed-registered metaverse-id coordinates)) (err ERR-DEED-ALREADY-EXISTS))
    (try! (contract-call? .Land-Registry verify-land metaverse-id coordinates))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get mint-fee) tx-sender authority-recipient))
    )
    (try! (nft-mint? land-deed next-id tx-sender))
    (map-insert deed-metadata { deed-id: next-id }
      {
        owner: tx-sender,
        metaverse-id: metaverse-id,
        coordinates: coordinates,
        title: title,
        description: description,
        attributes: attributes,
        location: location,
        dimensions: dimensions,
        value: value,
        royalty-rate: royalty-rate,
        royalty-receiver: royalty-receiver,
        timestamp: block-height,
        status: true,
        grace-period: grace-period
      }
    )
    (map-insert deeds-by-coordinates { metaverse-id: metaverse-id, coordinates: coordinates } next-id)
    (var-set last-deed-id next-id)
    (print { event: "deed-minted", id: next-id })
    (ok next-id)
  )
)

(define-public (transfer-deed (deed-id uint) (new-owner principal))
  (let ((current-owner (unwrap! (nft-get-owner? land-deed deed-id) (err ERR-DEED-NOT-FOUND))))
    (asserts! (is-eq tx-sender current-owner) (err ERR-NOT-AUTHORIZED))
    (try! (nft-transfer? land-deed deed-id tx-sender new-owner))
    (map-set deed-metadata { deed-id: deed-id }
      (merge (unwrap-panic (map-get? deed-metadata { deed-id: deed-id }))
        { owner: new-owner }))
    (print { event: "deed-transferred", id: deed-id, new-owner: new-owner })
    (ok true)
  )
)

(define-public (update-deed
  (deed-id uint)
  (update-title (string-ascii 100))
  (update-description (string-utf8 500))
  (update-attributes (string-ascii 200))
)
  (let ((deed (map-get? deed-metadata { deed-id: deed-id })))
    (match deed
      d
        (begin
          (asserts! (is-eq (get owner d) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-title update-title))
          (try! (validate-description update-description))
          (try! (validate-attributes update-attributes))
          (map-set deed-metadata { deed-id: deed-id }
            (merge d
              {
                title: update-title,
                description: update-description,
                attributes: update-attributes,
                timestamp: block-height
              }
            )
          )
          (map-set deed-updates { deed-id: deed-id }
            {
              update-title: update-title,
              update-description: update-description,
              update-attributes: update-attributes,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "deed-updated", id: deed-id })
          (ok true)
        )
      (err ERR-DEED-NOT-FOUND)
    )
  )
)

(define-public (burn-deed (deed-id uint))
  (let ((current-owner (unwrap! (nft-get-owner? land-deed deed-id) (err ERR-DEED-NOT-FOUND))))
    (asserts! (is-eq tx-sender current-owner) (err ERR-NOT-AUTHORIZED))
    (try! (nft-burn? land-deed deed-id tx-sender))
    (let ((deed (unwrap-panic (map-get? deed-metadata { deed-id: deed-id }))))
      (map-delete deeds-by-coordinates { metaverse-id: (get metaverse-id deed), coordinates: (get coordinates deed) })
    )
    (map-delete deed-metadata { deed-id: deed-id })
    (map-delete deed-updates { deed-id: deed-id })
    (print { event: "deed-burned", id: deed-id })
    (ok true)
  )
)

(define-read-only (get-deed-owner (deed-id uint))
  (match (nft-get-owner? land-deed deed-id)
    owner (ok owner)
    (err ERR-DEED-NOT-FOUND)
  )
)

(define-read-only (get-deed-count)
  (ok (var-get last-deed-id))
)

(define-public (check-deed-existence (metaverse-id (string-ascii 50)) (coordinates (string-ascii 100)))
  (ok (is-deed-registered metaverse-id coordinates))
)