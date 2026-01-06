-- Function to create a reservation with concurrency control
-- This ensures atomicity when checking availability and reserving a device
CREATE OR REPLACE FUNCTION create_reservation(
  p_user_id UUID,
  p_device_model_id UUID,
  p_loan_duration_days INTEGER DEFAULT 2
)
RETURNS TABLE (loan_id UUID, device_id UUID) AS $$
DECLARE
  v_device_id UUID;
  v_loan_id UUID;
  v_due_date TIMESTAMPTZ;
BEGIN
  -- Calculate due date
  v_due_date := NOW() + (p_loan_duration_days || ' days')::INTERVAL;

  -- Find an available device (with row-level locking to prevent race conditions)
  SELECT d.id INTO v_device_id
  FROM devices d
  WHERE d.device_model_id = p_device_model_id
    AND d.is_available = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM loans l
      WHERE l.device_id = d.id
        AND l.status IN ('reserved', 'collected')
    )
  ORDER BY d.created_at ASC  -- FIFO order
  LIMIT 1
  FOR UPDATE SKIP LOCKED;  -- Skip locked rows to handle concurrency

  -- Check if a device was found
  IF v_device_id IS NULL THEN
    RAISE EXCEPTION 'NO_AVAILABLE_DEVICES: No available devices for this model';
  END IF;

  -- Create the loan
  INSERT INTO loans (
    user_id,
    device_id,
    status,
    reserved_at,
    due_date
  ) VALUES (
    p_user_id,
    v_device_id,
    'reserved',
    NOW(),
    v_due_date
  )
  RETURNING id INTO v_loan_id;

  -- Return the loan and device IDs
  RETURN QUERY SELECT v_loan_id, v_device_id;
END;
$$ LANGUAGE plpgsql;
