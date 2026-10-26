"""Camera + hand landmark viewer. Smoke test only (ADR 0002): never touches the dataset. Press q to quit."""
import cv2
import mediapipe as mp

hands_mod = mp.solutions.hands


def draw_landmarks(hands, frame):
    """Draw landmarks for up to two hands onto a BGR frame in place; return the hand count."""
    result = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    found = result.multi_hand_landmarks or []
    for lm in found:
        mp.solutions.drawing_utils.draw_landmarks(frame, lm, hands_mod.HAND_CONNECTIONS)
    return len(found)


def main(camera=0):
    cap = cv2.VideoCapture(camera)
    if not cap.isOpened():
        raise SystemExit(f"cannot open camera {camera}")
    with hands_mod.Hands(max_num_hands=2) as hands:
        while cap.isOpened():
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)
            n = draw_landmarks(hands, frame)
            cv2.putText(frame, f"hands: {n}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.imshow("cara viewer", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
