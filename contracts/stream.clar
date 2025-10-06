;; error codes
(define-constant ERR_UNAUTHORIZED (err u0))
(define-constant ERR_INVALID_SIGNATURE (err u1))
(define-constant ERR_STREAM_STILL_ACTIVE (err u2))
(define-constant ERR_INVALID_STREAM_ID (err u3))
(define-constant ERR_INVALID_PLAN_ID (err u4))
(define-constant ERR_PLAN_NOT_READY (err u5))
(define-constant ERR_PLAN_EMPTY (err u6))
(define-constant ERR_INVALID_PARAM (err u7))
(define-constant ERR_PLAN_COMPLETE (err u8))

;; data vars
(define-data-var latest-stream-id uint u0)
(define-data-var nonce uint u0)
(define-data-var latest-airtime-plan-id uint u0)

;; streams mapping
(define-map streams
  uint ;; stream-id
  {
    sender: principal,
    recipient: principal,
    balance: uint,
    withdrawn-balance: uint,
    payment-per-block: uint,
    timeframe:     {
      start-block: uint,
      stop-block: uint,
    },
  }
)

;; Airtime drip plans keep metadata that makes sense in Lagos traffic - small steady payouts for mobile top-ups
(define-map airtime-plans
  uint
  {
    merchant: principal,
    customer: principal,
    phone: (buff 16),
    network: (buff 16),
    payout-amount: uint,
    interval: uint,
    next-claim-block: uint,
    total-funded: uint,
    remaining-balance: uint,
    total-claims: uint,
    max-claims: uint,
  }
)

;; Create a new stream
(define-public (stream-to
    (recipient principal)
    (initial-balance uint)
    (timeframe {
      start-block: uint,
      stop-block: uint,
    })
    (payment-per-block uint)
  )
  (let (
      (stream {
        sender: contract-caller,
        recipient: recipient,
        balance: initial-balance,
        withdrawn-balance: u0,
        payment-per-block: payment-per-block,
        timeframe: timeframe,
      })
      (current-stream-id (var-get latest-stream-id))
    )
    ;; Okay stx-transfer takes in (amount, sender, recipient) arguments
    ;; for the `recipient` - we do `(as-contract tx-sender)`
    ;; `as-contract` switches the `tx-sender` variable to be the contract principal
    ;; inside it's scope
    ;; so doing `as-contract tx-sender` gives us the contract address itself
    ;; this is like doing address(this) in Solidity
    (try! (stx-transfer? initial-balance contract-caller (as-contract tx-sender)))
    (map-set streams current-stream-id stream)
    (var-set latest-stream-id (+ current-stream-id u1))
    (ok current-stream-id)
  )
)

;; Helper to multiply two uints safely - Clarity already checks overflow so we just wrap it
(define-private (mul
    (a uint)
    (b uint)
  )
  (* a b)
)

;; Create airtime plan tailored for recurring top-ups
(define-public (create-airtime-plan
    (customer principal)
    (phone (buff 16))
    (network (buff 16))
    (payout-amount uint)
    (interval uint)
    (max-claims uint)
  )
  (begin
    (asserts! (> payout-amount u0) ERR_INVALID_PARAM)
    (asserts! (> interval u0) ERR_INVALID_PARAM)
    (asserts! (> max-claims u0) ERR_INVALID_PARAM)
    (let (
        (required-fund (mul payout-amount max-claims))
        (plan-id (var-get latest-airtime-plan-id))
        (starting-block (+ block-height interval))
      )
      (try! (stx-transfer? required-fund contract-caller (as-contract tx-sender)))
      (map-set airtime-plans plan-id {
        merchant: contract-caller,
        customer: customer,
        phone: phone,
        network: network,
        payout-amount: payout-amount,
        interval: interval,
        next-claim-block: starting-block,
        total-funded: required-fund,
        remaining-balance: required-fund,
        total-claims: u0,
        max-claims: max-claims,
      })
      (var-set latest-airtime-plan-id (+ plan-id u1))
      (ok plan-id)
    )
  )
)

;; Allow customer to claim airtime payout once interval elapses
(define-public (claim-airtime (plan-id uint))
  (let (
      (plan (unwrap! (map-get? airtime-plans plan-id) ERR_INVALID_PLAN_ID))
      (payout (get payout-amount plan))
    )
    (asserts! (is-eq contract-caller (get customer plan)) ERR_UNAUTHORIZED)
    (asserts! (<= (get next-claim-block plan) block-height) ERR_PLAN_NOT_READY)
    (asserts! (> (get remaining-balance plan) u0) ERR_PLAN_EMPTY)
    (asserts! (< (get total-claims plan) (get max-claims plan)) ERR_PLAN_COMPLETE)
    (try! (as-contract (stx-transfer? payout tx-sender (get customer plan))))
    (map-set airtime-plans plan-id
      (merge plan {
        remaining-balance: (- (get remaining-balance plan) payout),
        total-claims: (+ (get total-claims plan) u1),
        next-claim-block: (+ (get next-claim-block plan) (get interval plan)),
      })
    )
    (ok payout)
  )
)

;; Merchant can extend plan by adding more claim slots
(define-public (topup-airtime
    (plan-id uint)
    (extra-claims uint)
  )
  (let (
      (plan (unwrap! (map-get? airtime-plans plan-id) ERR_INVALID_PLAN_ID))
      (payout (get payout-amount plan))
    )
    (asserts! (is-eq contract-caller (get merchant plan)) ERR_UNAUTHORIZED)
    (asserts! (> extra-claims u0) ERR_INVALID_PARAM)
    (let ((refill-amount (mul payout extra-claims)))
      (try! (stx-transfer? refill-amount contract-caller (as-contract tx-sender)))
      (map-set airtime-plans plan-id
        (merge plan {
          remaining-balance: (+ (get remaining-balance plan) refill-amount),
          total-funded: (+ (get total-funded plan) refill-amount),
          max-claims: (+ (get max-claims plan) extra-claims),
        })
      )
      (ok refill-amount)
    )
  )
)

;; Merchant can cash out whatever is left when plan wraps up or buyer already has enough data
(define-public (cancel-airtime (plan-id uint))
  (let (
      (plan (unwrap! (map-get? airtime-plans plan-id) ERR_INVALID_PLAN_ID))
      (outstanding (get remaining-balance plan))
    )
    (asserts! (is-eq contract-caller (get merchant plan)) ERR_UNAUTHORIZED)
    (asserts! (> outstanding u0) ERR_PLAN_EMPTY)
    (map-set airtime-plans plan-id
      (merge plan {
        remaining-balance: u0,
        max-claims: (get total-claims plan),
      })
    )
    (try! (as-contract (stx-transfer? outstanding tx-sender (get merchant plan))))
    (ok outstanding)
  )
)

;; Read-only helper to fetch airtime plan
(define-read-only (get-airtime-plan (plan-id uint))
  (map-get? airtime-plans plan-id)
)

;; Read-only helper to know how many plans exist
(define-read-only (get-latest-airtime-plan-id)
  (ok (var-get latest-airtime-plan-id))
)

;; Increase the locked STX balance for a stream
(define-public (refuel
    (stream-id uint)
    (amount uint)
  )
  (let ((stream (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID)))
    (asserts! (is-eq contract-caller (get sender stream)) ERR_UNAUTHORIZED)
    (try! (stx-transfer? amount contract-caller (as-contract tx-sender)))
    (map-set streams stream-id
      (merge stream { balance: (+ (get balance stream) amount) })
    )
    (ok amount)
  )
)

;; Check balance for a party involved in a stream
(define-read-only (balance-of
    (stream-id uint)
    (who principal)
  )
  (let (
      (stream (unwrap! (map-get? streams stream-id) u0))
      (block-delta (calculate-block-delta (get timeframe stream)))
      (recipient-balance (* block-delta (get payment-per-block stream)))
    )
    (if (is-eq who (get recipient stream))
      (- recipient-balance (get withdrawn-balance stream))
      (if (is-eq who (get sender stream))
        (- (get balance stream) recipient-balance)
        u0
      )
    )
  )
)

;; Calculate the number of blocks a stream has been active
(define-read-only (calculate-block-delta (timeframe {
  start-block: uint,
  stop-block: uint,
}))
  (let (
      (start-block (get start-block timeframe))
      (stop-block (get stop-block timeframe))
      (delta (if (<= block-height start-block)
        ;; then
        u0
        ;; else
        (if (< block-height stop-block)
          ;; then
          (- block-height start-block)
          ;; else
          (- stop-block start-block)
        )
      ))
    )
    delta
  )
)

;; Withdraw received tokens
(define-public (withdraw (stream-id uint))
  (let (
      (stream (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
      (balance (balance-of stream-id contract-caller))
    )
    (asserts! (is-eq contract-caller (get recipient stream)) ERR_UNAUTHORIZED)
    (map-set streams stream-id
      (merge stream { withdrawn-balance: (+ (get withdrawn-balance stream) balance) })
    )
    (try! (as-contract (stx-transfer? balance tx-sender (get recipient stream))))
    (ok balance)
  )
)

;; Withdraw excess locked tokens
(define-public (refund (stream-id uint))
  (let (
      (stream (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
      (balance (balance-of stream-id (get sender stream)))
    )
    (asserts! (is-eq contract-caller (get sender stream)) ERR_UNAUTHORIZED)
    (asserts! (< (get stop-block (get timeframe stream)) block-height)
      ERR_STREAM_STILL_ACTIVE
    )
    (map-set streams stream-id
      (merge stream { balance: (- (get balance stream) balance) })
    )
    (try! (as-contract (stx-transfer? balance tx-sender (get sender stream))))
    (ok balance)
  )
)

;; Get hash of stream
(define-read-only (hash-stream
    (stream-id uint)
    (new-payment-per-block uint)
    (new-timeframe {
      start-block: uint,
      stop-block: uint,
    })
  )
  (let (
      (stream (unwrap! (map-get? streams stream-id) (sha256 0)))
      (msg (concat
        (concat (unwrap-panic (to-consensus-buff? stream))
          (unwrap-panic (to-consensus-buff? new-payment-per-block))
        )
        (unwrap-panic (to-consensus-buff? new-timeframe))
      ))
    )
    (sha256 msg)
  )
)

;; Signature verification
(define-read-only (validate-signature
    (hash (buff 32))
    (signature (buff 65))
    (signer principal)
  )
  (is-eq (principal-of? (unwrap! (secp256k1-recover? hash signature) false))
    (ok signer)
  )
)

;; Update stream configuration
(define-public (update-details
    (stream-id uint)
    (payment-per-block uint)
    (timeframe {
      start-block: uint,
      stop-block: uint,
    })
    (signer principal)
    (signature (buff 65))
  )
  (let ((stream (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID)))
    (asserts!
      (validate-signature (hash-stream stream-id payment-per-block timeframe)
        signature signer
      )
      ERR_INVALID_SIGNATURE
    )
    (asserts!
      (or
        (and (is-eq (get sender stream) contract-caller) (is-eq (get recipient stream) signer))
        (and (is-eq (get sender stream) signer) (is-eq (get recipient stream) contract-caller))
      )
      ERR_UNAUTHORIZED
    )
    (map-set streams stream-id
      (merge stream {
        payment-per-block: payment-per-block,
        timeframe: timeframe,
      })
    )
    (ok true)
  )
)
